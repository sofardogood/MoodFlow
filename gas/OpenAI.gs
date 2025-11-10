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
  const dataText = data.map(d =>
    `[${d.nickname}] スコア: ${d.moodScore}, コメント: ${d.comment || 'なし'}`
  ).join('\n');

  const prompt = `以下は会議中の参加者の感情スコアとコメントです。
この会議を分析して、重要なインサイトを抽出してください。

# 統計情報
- 総発言数: ${stats.total}
- 参加者数: ${stats.participants}
- 平均感情スコア: ${stats.average.toFixed(2)} (-5〜+5のスケール)
- ポジティブ: ${stats.positive}件 (${stats.positiveRate.toFixed(1)}%)
- ネガティブ: ${stats.negative}件 (${stats.negativeRate.toFixed(1)}%)

# データ
${dataText}

以下のJSON形式で分析結果を返してください：
{
  "overallMood": "会議全体の雰囲気を1文で",
  "keyInsights": ["重要な気づき1", "重要な気づき2", "重要な気づき3"],
  "positiveHighlights": ["ポジティブな点1", "ポジティブな点2"],
  "concerns": ["懸念事項1", "懸念事項2"],
  "recommendations": ["推奨アクション1", "推奨アクション2", "推奨アクション3"]
}

必ずJSONのみを返してください。余計な説明は不要です。`;

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは会議分析の専門家です。データを分析して、有益なインサイトを提供してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
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
    overallMood: '会議の雰囲気は概ね良好でした。',
    keyInsights: [
      '参加者の感情スコアが記録されました',
      '会議の進行状況が可視化されました',
      'リアルタイムでのフィードバックが得られました'
    ],
    positiveHighlights: [
      '参加者が積極的に意見を共有しました',
      '建設的な議論が行われました'
    ],
    concerns: [
      'より詳細な分析にはOpenAI APIキーの設定が必要です'
    ],
    recommendations: [
      '次回の会議でも同様のフィードバックを収集することを推奨します',
      '参加者の感情変化に注目してください'
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
