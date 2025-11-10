/**
 * OpenAI API連携
 */

/**
 * 統計情報を計算
 */
function calculateStats(data) {
  const total = data.length;
  const scores = data.map(d => d.moodScore);
  const sum = scores.reduce((a, b) => a + b, 0);
  const average = sum / total;

  const positive = scores.filter(s => s > 0).length;
  const negative = scores.filter(s => s < 0).length;
  const neutral = scores.filter(s => s === 0).length;

  const participants = [...new Set(data.map(d => d.nickname))].length;

  return {
    total: total,
    participants: participants,
    average: average,
    positive: positive,
    negative: negative,
    neutral: neutral,
    positiveRate: (positive / total) * 100,
    negativeRate: (negative / total) * 100
  };
}

/**
 * OpenAI APIを使って会議データを分析
 */
function analyzeMeetingData(data, stats) {
  const config = getProperties();

  // プロンプトを構築
  // 時系列順にソート
  const sortedData = data.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const dataText = sortedData.map((d, index) =>
    `[${index + 1}] ${d.nickname} (${new Date(d.timestamp).toLocaleTimeString('ja-JP')}): 感情スコア ${d.moodScore}, ${d.comment || 'コメントなし'}`
  ).join('\n');

  const prompt = `以下は会議中の参加者がリアルタイムで記録した感情スコアとコメントを時系列順に並べたものです。
これは参加者の主観的な気持ちの記録です。「発言」ではなく「感情」や「気持ち」です。
感情の変化を客観的かつ中立的に記述し、登壇者や運営側がどうサポートできるかの視点で分析してください。

# 統計情報
- 総記録数: ${stats.total}
- 参加者数: ${stats.participants}
- 平均感情スコア: ${stats.average.toFixed(2)} (-5〜+5のスケール、マイナスは難しい/不安、プラスは理解/楽しい)
- ポジティブな感情: ${stats.positive}件 (${stats.positiveRate.toFixed(1)}%)
- ネガティブな感情: ${stats.negative}件 (${stats.negativeRate.toFixed(1)}%)

# 時系列データ（感情の記録）
${dataText}

以下のJSON形式で分析結果を返してください：
{
  "overallMood": "会議全体の雰囲気を簡潔に（1〜2文）。「〜な雰囲気でした」という形式で。",
  "timeProgression": "時間経過に伴う感情の変化を客観的に記述。「序盤は〜な感情の参加者が多く、中盤で〜な雰囲気に変化し、終盤は〜」という形式で。",
  "keyInsights": ["感情データから読み取れる重要なパターン。「〜の感情が見られた」という表現で。", "パターン2", "パターン3"],
  "positiveHighlights": ["ポジティブな感情や雰囲気が見られた点。「〜な雰囲気があった」という表現で。", "点2"],
  "concerns": ["サポートが必要そうな感情の傾向。「〜な気持ちの参加者がいた」という表現で改善のチャンスとして。", "点2"],
  "speakerAdvice": ["参加者の感情をより良くするための具体的な工夫。「〜すると参加者の気持ちが〜しやすくなる」という提案形式で。", "工夫2", "工夫3"],
  "recommendations": ["次回の会議をより良くするための提案。具体的なアクションとして。", "提案2"]
}

**絶対に守るべき表現ルール**:
1. 「発言」という言葉を一切使わない。代わりに「感情」「気持ち」「雰囲気」を使う
2. 「〜のせいで」「〜により」などの因果関係を示す否定的表現は使わない
3. 「〜が悪化した」「問題があった」などの否定的判断を使わない
4. 参加者名を出す場合は「〜さんの感情が〜だった」と客観的に記述
5. すべて「〜な雰囲気でした」「〜な感情が見られました」という過去形で
6. 誰かを責めたり評価したりする表現は一切使わない

必ずJSONのみを返してください。`;

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'あなたは会議感情分析の専門家です。参加者の感情データを客観的かつ中立的に分析してください。重要：これは「発言」の分析ではなく、参加者が記録した「感情」「気持ち」の分析です。「発言」という言葉は絶対に使わず、「感情が〜だった」「雰囲気が〜でした」という表現を使ってください。誰かを責めたり、因果関係で否定的に結びつけたりせず、すべて観察された事実として記述してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      console.error('OpenAI API error:', result.error);
      return getDefaultAnalysis();
    }

    const content = result.choices[0].message.content;
    return JSON.parse(content);

  } catch (error) {
    console.error('analyzeMeetingData error:', error);
    return getDefaultAnalysis();
  }
}

/**
 * デフォルトの分析結果（API失敗時のフォールバック）
 */
function getDefaultAnalysis() {
  return {
    overallMood: '参加者の感情が記録されました。',
    timeProgression: '時間経過に伴う感情の詳細な変化を確認するには、OpenAI APIの設定が必要です。',
    keyInsights: [
      '参加者から感情スコアがリアルタイムで記録されました',
      '会議中の感情の推移が可視化されました',
      '参加者の気持ちを把握するデータが収集できました'
    ],
    positiveHighlights: [
      '参加者が積極的に感情を記録してくれました',
      'リアルタイムでのフィードバックが得られました'
    ],
    concerns: [
      'より詳細な感情分析にはOpenAI APIキーの設定が必要です'
    ],
    speakerAdvice: [
      '参加者の感情スコアを定期的に確認し、内容の難易度や進行速度を調整してみましょう',
      '感情の変化に気づいたら、質問タイムや小休憩を挟むと良いでしょう',
      '参加者の理解度に合わせて、説明を補足したり例を追加したりしましょう'
    ],
    recommendations: [
      '次回の会議でも参加者の感情を記録してもらい、継続的に改善しましょう',
      '感情データを活用して、より参加者に寄り添った会議運営を目指しましょう'
    ]
  };
}

/**
 * 参加者別の分析
 */
function analyzeByParticipant(data) {
  const participantMap = {};

  data.forEach(d => {
    if (!participantMap[d.nickname]) {
      participantMap[d.nickname] = {
        nickname: d.nickname,
        scores: [],
        comments: []
      };
    }
    participantMap[d.nickname].scores.push(d.moodScore);
    if (d.comment) {
      participantMap[d.nickname].comments.push(d.comment);
    }
  });

  const analyses = Object.values(participantMap).map(p => {
    const sum = p.scores.reduce((a, b) => a + b, 0);
    const avg = sum / p.scores.length;
    const trend = calculateTrend(p.scores);

    return {
      nickname: p.nickname,
      count: p.scores.length,
      averageScore: avg,
      trend: trend
    };
  });

  // 発言数でソート
  analyses.sort((a, b) => b.count - a.count);

  return analyses;
}

/**
 * トレンドを計算
 */
function calculateTrend(scores) {
  if (scores.length < 3) return 'stable';

  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.5) return 'rising';
  if (diff < -0.5) return 'falling';
  return 'stable';
}

/**
 * タイムライン分析（5分間隔）
 */
function analyzeTimeline(data) {
  if (data.length === 0) return [];

  const intervals = [];
  const INTERVAL_MS = 5 * 60 * 1000; // 5分

  // タイムスタンプでソート
  const sortedData = data.slice().sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  const startTime = new Date(sortedData[0].timestamp);
  const endTime = new Date(sortedData[sortedData.length - 1].timestamp);

  let currentTime = new Date(startTime);

  while (currentTime <= endTime) {
    const nextTime = new Date(currentTime.getTime() + INTERVAL_MS);

    const intervalData = sortedData.filter(d => {
      const t = new Date(d.timestamp);
      return t >= currentTime && t < nextTime;
    });

    if (intervalData.length > 0) {
      const scores = intervalData.map(d => d.moodScore);
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = sum / scores.length;

      intervals.push({
        startTime: currentTime.toISOString(),
        endTime: nextTime.toISOString(),
        count: intervalData.length,
        avgScore: avg
      });
    }

    currentTime = nextTime;
  }

  return intervals;
}

/**
 * 3分割の感情分布を計算
 */
function calculateThreeSegmentEmotionDistribution(data) {
  if (data.length === 0) return [];

  // タイムスタンプでソート
  const sortedData = data.slice().sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  const segmentSize = Math.ceil(sortedData.length / 3);

  const segments = [
    { name: '序盤', data: sortedData.slice(0, segmentSize) },
    { name: '中盤', data: sortedData.slice(segmentSize, segmentSize * 2) },
    { name: '終盤', data: sortedData.slice(segmentSize * 2) }
  ];

  return segments.map(segment => {
    const positive = segment.data.filter(d => d.moodScore > 0).length;
    const neutral = segment.data.filter(d => d.moodScore === 0).length;
    const negative = segment.data.filter(d => d.moodScore < 0).length;
    const total = segment.data.length;

    return {
      name: segment.name,
      positive: positive,
      neutral: neutral,
      negative: negative,
      total: total,
      positiveRate: total > 0 ? (positive / total) * 100 : 0,
      neutralRate: total > 0 ? (neutral / total) * 100 : 0,
      negativeRate: total > 0 ? (negative / total) * 100 : 0
    };
  });
}
