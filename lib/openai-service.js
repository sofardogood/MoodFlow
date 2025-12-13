const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';

function getModel(modelName = DEFAULT_MODEL) {
  return genAI.getGenerativeModel({ model: modelName });
}

function extractJSONFromText(text) {
  if (!text) return null;
  let jsonStr = text;
  if (text.includes('```json')) {
    jsonStr = text.split('```json')[1].split('```')[0].trim();
  } else if (text.includes('```')) {
    jsonStr = text.split('```')[1].split('```')[0].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('JSON parse failed from model text:', text);
    throw err;
  }
}

/**
 * 会議データを分析してサマリーを生成
 */
async function analyzeMeetingData(moodData, summaryData = [], options = {}) {
  if ((!moodData || moodData.length === 0) && summaryData.length === 0) {
    throw new Error('刁E��するチE�Eタがありません');
  }

  const targetLanguage = options.targetLanguage || 'ja';
  const stats = calculateStats(moodData);
  const timeline = analyzeTimeline(moodData);

  const comments = moodData
    .filter(d => d.comment && d.comment.trim() !== '')
    .map(d => `[${d.nickname}] (score:${d.moodScore}) ${d.comment}`)
    .join('\n');

  const summaryText = summaryData
    .map(s => `[${new Date(s.startTime).toLocaleTimeString()} - ${new Date(s.endTime).toLocaleTimeString()}] ${s.content}`)
    .join('\n\n');

  const prompt = `あなたは会議ファシリテーションの専門家です。以下のデータから、${targetLanguage}でJSONのみを返してください。

# 統計情報
- 総リアクション数: ${stats.total}
- 参加者数: ${stats.participants}
- 平均スコア (-5〜5): ${stats.average.toFixed(2)}
- ポジティブ件数: ${stats.positive} (率: ${stats.positiveRate.toFixed(1)}%)
- ネガティブ件数: ${stats.negative} (率: ${stats.negativeRate.toFixed(1)}%)

# 要約(5分ごと)
${summaryText || '要約なし'}

# コメント一覧
${comments || 'コメントなし'}

以下のJSONのみを返してください:
{
  "overallMood": "会議全体の雰囲気を1文で",
  "keyInsights": ["重要な気づき1", "重要な気づき2"],
  "positiveHighlights": ["良かった点1", "良かった点2"],
  "concerns": ["気をつけるべき点1", "気をつけるべき点2"],
  "participantEngagement": "参加状況の評価",
  "recommendations": ["次回に向けた具体的アクション1", "アクション2"],
  "facilitatorCues": ["ファシリ向けリアルタイム介入ヒント1", "ヒント2"],
  "executiveSummary": "経営層向けの短い要約（KPI/決定事項/懸念）",
  "taggedInsights": [
    {"text": "決定事項や懸念など", "tag": "decision|concern|idea|other"}
  ]
}`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = extractJSONFromText(response.text());

    return {
      stats,
      timeline,
      analysis,
      targetLanguage
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('AI刁E��に失敗しました: ' + error.message);
  }
}

async function translateText(text, targetLanguage = 'en') {
  if (!text) return '';
  const prompt = `Translate the following text to ${targetLanguage}. Return only the translated text without commentary.\n\n${text}`;
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini translation error:', error);
    throw new Error('翻訳に失敗しました: ' + error.message);
  }
}

async function classifyInsight(text) {
  if (!text) return 'other';
  const prompt = `Categorize the following meeting note as one of: decision, concern, idea, other. Reply with JSON {"tag":"..."}. Note only.\n\n${text}`;
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed = extractJSONFromText(response.text());
    return parsed?.tag || 'other';
  } catch (error) {
    console.error('Gemini classify error:', error);
    return 'other';
  }
}

/**
 * 参加者別分析
 */
async function analyzeByParticipant(data) {
  const participantMap = {};

  data.forEach(d => {
    if (!participantMap[d.nickname]) participantMap[d.nickname] = [];
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
      entries: entries.slice(0, 5)
    });
  }

  return participantAnalyses.sort((a, b) => b.count - a.count);
}

/**
 * 時系列分析
 */
function analyzeTimeline(data) {
  const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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
  calculateStats,
  translateText,
  classifyInsight
};
