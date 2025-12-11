const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * 会議データを分析してサマリーを生成 (Gemini 2.5 Pro)
 */
async function analyzeMeetingData(moodData, summaryData = []) {
  if ((!moodData || moodData.length === 0) && summaryData.length === 0) {
    throw new Error('分析するデータがありません');
  }

  // 統計情報を計算
  const stats = calculateStats(moodData);

  // コメントを抽出
  const comments = moodData
    .filter(d => d.comment && d.comment.trim() !== '')
    .map(d => `[${d.nickname}] (スコア: ${d.moodScore}) ${d.comment}`)
    .join('\n');

  // 要約テキストを結合
  const summaryText = summaryData.map(s => `[${new Date(s.startTime).toLocaleTimeString()} - ${new Date(s.endTime).toLocaleTimeString()}] ${s.content}`).join('\n\n');

  const prompt = `あなたは会議分析の専門家です。データから重要なインサイトを抽出し、建設的なフィードバックを提供します。

以下は会議中の「参加者の感情スコア/コメント」と「AIによる5分ごとの会話要約」です。
この会議を総合的に分析して、重要なインサイトを抽出してください。

# 統計情報
- 総発言数(Reaction): ${stats.total}
- 参加者数: ${stats.participants}
- 平均感情スコア: ${stats.average.toFixed(2)} (-5〜+5のスケール)
- ポジティブ反応: ${stats.positive}件 (${stats.positiveRate.toFixed(1)}%)
- ネガティブ反応: ${stats.negative}件 (${stats.negativeRate.toFixed(1)}%)

# 会話の要約 (時系列)
${summaryText || "要約データなし"}

# 参加者のコメント
${comments || "コメントなし"}

以下のJSON形式で分析結果を返してください。JSONのみを出力し、他のテキストは含めないでください：
{
  "overallMood": "会議全体の雰囲気を1文で。会話内容と感情スコアの両方を考慮してください。",
  "keyInsights": ["重要な気づき1 (議論の内容に基づく)", "重要な気づき2 (感情の変化に基づく)", "重要な気づき3"],
  "positiveHighlights": ["良かった点1", "良かった点2"],
  "concerns": ["【会議中に気をつけること】例: 「○○について話す時は、△△に注意しましょう」という形式で、次回の会議中にリアルタイムで活かせる具体的なアドバイス1", "アドバイス2"],
  "participantEngagement": "参加者のエンゲージメント状況評価",
  "recommendations": ["次回に向けた具体的なアクション1", "アクション2"]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = text;
    if (text.includes('```json')) {
      jsonStr = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      jsonStr = text.split('```')[1].split('```')[0].trim();
    }

    const analysis = JSON.parse(jsonStr);

    return {
      stats,
      analysis
    };
  } catch (error) {
    console.error('Gemini API error:', error);
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
  if (!data || data.length === 0) {
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

  const scores = data.map(d => d.moodScore || d.score || 0);
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
