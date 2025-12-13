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
 * 会議データを分析してサマリーを生成（強化版）
 */
async function analyzeMeetingData(moodData, summaryData = [], transcripts = [], surveyResponses = [], options = {}) {
  // データ存在チェック（アンケートのみの場合もありえるので条件緩める）
  if ((!moodData || moodData.length === 0) && summaryData.length === 0 && transcripts.length === 0 && surveyResponses.length === 0) {
    throw new Error('分析するデータがありません');
  }

  const targetLanguage = options.targetLanguage || 'ja';
  const stats = calculateStats(moodData);
  const timeline = analyzeTimeline(moodData);

  // アンケート集計
  const surveyStats = {
    count: surveyResponses.length,
    avgSatisfaction: surveyResponses.length > 0
      ? (surveyResponses.reduce((a, b) => a + (b.satisfaction || 0), 0) / surveyResponses.length).toFixed(1)
      : '-'
  };

  const surveyText = surveyResponses.length > 0
    ? surveyResponses.map(s => `[満足度:${s.satisfaction || '-'}] 良:${s.positive || '-'} / 改:${s.improvement || '-'}`).join('\n')
    : 'アンケート回答なし';

  // ★ ムードと文字起こしを時系列で照合
  const correlatedInsights = correlateMoodAndTranscripts(moodData, transcripts);

  const comments = moodData
    .filter(d => d.comment && d.comment.trim() !== '')
    .map(d => `[${d.nickname}] (score:${d.moodScore}) ${d.comment}`)
    .join('\n');

  const summaryText = summaryData
    .map(s => `[${new Date(s.startTime).toLocaleTimeString()} - ${new Date(s.endTime).toLocaleTimeString()}] ${s.content}`)
    .join('\n\n');

  // ★ 文字起こしテキスト（時系列）
  const transcriptText = transcripts
    .map(t => `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speaker}: ${t.text}`)
    .join('\n');

  // ★ ムード高低と対応する会話内容
  const moodContextText = correlatedInsights
    .map(c => `[${c.timeRange}] 平均ムード: ${c.avgMood.toFixed(1)} | 会話: ${c.transcriptSnippet}`)
    .join('\n');

  const prompt = `あなたは会議ファシリテーションの専門家です。以下のデータから、${targetLanguage}でJSONのみを返してください。

# 統計情報
- 総リアクション数: ${stats.total}
- 参加者数: ${stats.participants}
- 平均スコア (-5〜5): ${stats.average.toFixed(2)}
- アンケート回答数: ${surveyStats.count}
- アンケート平均満足度 (1-5): ${surveyStats.avgSatisfaction}

# アンケート自由記述
${surveyText}

# 要約(5分ごと)
${summaryText || '要約なし'}

# コメント一覧
${comments || 'コメントなし'}

# 文字起こし（時系列）
${transcriptText.substring(0, 3000) || '文字起こしなし'}

# ムードと会話内容の照合分析
${moodContextText || '照合データなし'}

以下のJSONのみを返してください（必ず全てのフィールドを埋めてください）:
{
  "overallMood": "会議全体の雰囲気を1文で",
  "keyInsights": ["重要な気づき1", "重要な気づき2", "重要な気づき3"],
  "positiveHighlights": ["良かった点1（どの話題でムードが上がったか具体的に）", "良かった点2"],
  "concerns": ["気をつけるべき点1（どの話題でムードが下がったか具体的に）", "気をつけるべき点2"],
  "participantEngagement": "参加状況の評価",
  "recommendations": ["次回に向けた具体的アクション1", "アクション2"],
  "facilitatorCues": ["ファシリテーター向けリアルタイム介入ヒント1", "ヒント2"],
  "executiveSummary": "経営層向けの短い要約（KPI/決定事項/懸念）",
  "timelinedAdvice": [
    {
      "timeRange": "0-15分",
      "moodTrend": "上昇/下降/安定",
      "keyTopics": "この時間帯の主な話題",
      "advice": "この時間帯に取るべきだったアクション"
    }
  ],
  "moodCorrelations": [
    {
      "topic": "どの話題や議論",
      "moodImpact": "ポジティブ/ネガティブ/中立",
      "snippet": "その時の具体的な発言内容",
      "recommendation": "今後同様のシーンでの推奨対応"
    }
  ],
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
    throw new Error('AI分析に失敗しました: ' + error.message);
  }
}

/**
 * ムードと文字起こしを時間帯別に照合
 */
function correlateMoodAndTranscripts(moodData, transcripts) {
  if (!moodData || moodData.length === 0 || !transcripts || transcripts.length === 0) {
    return [];
  }

  const sorted = [...moodData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const intervals = [];
  const intervalMinutes = 5;

  const startTime = new Date(sorted[0].timestamp);
  const endTime = new Date(sorted[sorted.length - 1].timestamp);
  let currentTime = new Date(startTime);

  while (currentTime <= endTime) {
    const intervalEnd = new Date(currentTime.getTime() + intervalMinutes * 60000);

    const intervalMoods = sorted.filter(d => {
      const t = new Date(d.timestamp);
      return t >= currentTime && t < intervalEnd;
    });

    const intervalTranscripts = transcripts.filter(t => {
      const time = new Date(t.timestamp);
      return time >= currentTime && time < intervalEnd;
    });

    if (intervalMoods.length > 0) {
      const avgMood = intervalMoods.reduce((sum, d) => sum + d.moodScore, 0) / intervalMoods.length;
      const transcriptSnippet = intervalTranscripts.slice(0, 3).map(t => `${t.speaker}: ${t.text.substring(0, 50)}`).join(' / ');

      intervals.push({
        timeRange: `${currentTime.toLocaleTimeString()}-${intervalEnd.toLocaleTimeString()}`,
        avgMood,
        moodCount: intervalMoods.length,
        transcriptSnippet: transcriptSnippet || '会話なし'
      });
    }

    currentTime = intervalEnd;
  }

  return intervals;
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
