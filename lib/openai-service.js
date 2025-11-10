const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 会議データを分析してサマリーを生成
 */
async function analyzeMeetingData(data) {
  if (!data || data.length === 0) {
    throw new Error('分析するデータがありません');
  }

  // 統計情報を計算
  const stats = calculateStats(data);

  // コメントを抽出
  const comments = data
    .filter(d => d.comment && d.comment.trim() !== '')
    .map(d => `[${d.nickname}] (スコア: ${d.moodScore}) ${d.comment}`)
    .join('\n');

  const prompt = `以下は会議中の参加者の感情スコアとコメントです。
この会議を分析して、重要なインサイトを抽出してください。

# 統計情報
- 総発言数: ${stats.total}
- 参加者数: ${stats.participants}
- 平均感情スコア: ${stats.average.toFixed(2)} (-5〜+5のスケール)
- ポジティブ発言: ${stats.positive}件 (${stats.positiveRate.toFixed(1)}%)
- ネガティブ発言: ${stats.negative}件 (${stats.negativeRate.toFixed(1)}%)

# 発言内容
${comments}

以下のJSON形式で分析結果を返してください：
{
  "overallMood": "会議全体の雰囲気を1文で",
  "keyInsights": ["重要な気づき1", "重要な気づき2", "重要な気づき3"],
  "positiveHighlights": ["ポジティブな点1", "ポジティブな点2"],
  "concerns": ["懸念事項1", "懸念事項2"],
  "participantEngagement": "参加者のエンゲージメント状況",
  "recommendations": ["推奨アクション1", "推奨アクション2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'あなたは会議分析の専門家です。データから重要なインサイトを抽出し、建設的なフィードバックを提供します。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    return {
      stats,
      analysis
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('AI分析に失敗しました: ' + error.message);
  }
}

/**
 * 参加者別の分析
 */
async function analyzeByParticipant(data) {
  const participantMap = {};

  // 参加者ごとにグループ化
  data.forEach(d => {
    if (!participantMap[d.nickname]) {
      participantMap[d.nickname] = [];
    }
    participantMap[d.nickname].push(d);
  });

  const participantAnalyses = [];

  for (const [nickname, entries] of Object.entries(participantMap)) {
    const scores = entries.map(e => e.moodScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = calculateTrend(scores);

    participantAnalyses.push({
      nickname,
      count: entries.length,
      averageScore: avg,
      trend,
      entries: entries.slice(0, 5) // 最新5件
    });
  }

  return participantAnalyses.sort((a, b) => b.count - a.count);
}

/**
 * 時系列分析
 */
function analyzeTimeline(data) {
  // 時系列順にソート
  const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // 5分間隔で集計
  const intervals = [];
  const intervalMinutes = 5;

  if (sorted.length === 0) return intervals;

  const startTime = new Date(sorted[0].timestamp);
  const endTime = new Date(sorted[sorted.length - 1].timestamp);

  let currentTime = new Date(startTime);

  while (currentTime <= endTime) {
    const intervalEnd = new Date(currentTime.getTime() + intervalMinutes * 60000);

    const intervalData = sorted.filter(d => {
      const t = new Date(d.timestamp);
      return t >= currentTime && t < intervalEnd;
    });

    if (intervalData.length > 0) {
      const avgScore = intervalData.reduce((sum, d) => sum + d.moodScore, 0) / intervalData.length;

      intervals.push({
        startTime: currentTime.toISOString(),
        endTime: intervalEnd.toISOString(),
        avgScore: avgScore,
        count: intervalData.length
      });
    }

    currentTime = intervalEnd;
  }

  return intervals;
}

/**
 * 統計計算
 */
function calculateStats(data) {
  if (data.length === 0) {
    return {
      total: 0,
      participants: 0,
      average: 0,
      max: 0,
      min: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
      positiveRate: 0,
      negativeRate: 0
    };
  }

  const scores = data.map(d => d.moodScore);
  const participants = new Set(data.map(d => d.nickname)).size;

  const sum = scores.reduce((a, b) => a + b, 0);
  const avg = sum / scores.length;
  const max = Math.max(...scores);
  const min = Math.min(...scores);

  const positive = scores.filter(s => s > 0).length;
  const negative = scores.filter(s => s < 0).length;
  const neutral = scores.filter(s => s === 0).length;

  return {
    total: data.length,
    participants,
    average: avg,
    max,
    min,
    positive,
    negative,
    neutral,
    positiveRate: (positive / data.length) * 100,
    negativeRate: (negative / data.length) * 100
  };
}

/**
 * トレンド計算
 */
function calculateTrend(scores) {
  if (scores.length < 2) return 'stable';

  const mid = Math.floor(scores.length / 2);
  const firstHalf = scores.slice(0, mid);
  const secondHalf = scores.slice(mid);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.5) return 'rising';
  if (diff < -0.5) return 'falling';
  return 'stable';
}

module.exports = {
  analyzeMeetingData,
  analyzeByParticipant,
  analyzeTimeline,
  calculateStats
};
