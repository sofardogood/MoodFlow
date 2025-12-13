const { createMood } = require('../lib/db');
const { translateText, classifyInsight } = require('../lib/openai-service');
const { checkAndSendAlerts } = require('../lib/alerts');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionId, nickname, moodScore, comment, emoticon, language, targetLanguage, role, department, theme } = req.body;

    if (!sessionId || !nickname || moodScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'セッションID・ニックネーム・スコアは必須です'
      });
    }

    if (moodScore < -5 || moodScore > 5) {
      return res.status(400).json({
        success: false,
        error: 'スコアは-5から5の範囲で指定してください'
      });
    }

    let translatedComment = null;
    let tag = null;
    const originalLanguage = language || 'ja';
    const targetLang = targetLanguage || process.env.DEFAULT_TRANSLATION_LANG || 'en';

    if (comment) {
      tag = await classifyInsight(comment);
      if (originalLanguage !== targetLang) {
        try {
          translatedComment = await translateText(comment, targetLang);
        } catch (e) {
          console.warn('Translation failed, continue without translatedComment', e.message);
        }
      }
    }

    const result = await createMood({
      sessionId,
      nickname,
      moodScore,
      comment: comment || '',
      translatedComment,
      language: originalLanguage,
      tag,
      emoticon: emoticon || '',
      role,
      department,
      theme
    });

    // Fire-and-forget alert check
    checkAndSendAlerts(sessionId, moodScore, nickname);

    return res.status(200).json({
      success: true,
      timestamp: result.timestamp
    });

  } catch (error) {
    console.error('Submit mood error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'サーバーエラーが発生しました'
    });
  }
};
