const { appendToSheet } = require('../lib/sheets');

module.exports = async (req, res) => {
  // CORSヘッダーを設定
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
    const { sessionId, nickname, moodScore, comment, emoticon } = req.body;

    // バリデーション
    if (!sessionId || !nickname || moodScore === undefined) {
      return res.status(400).json({
        success: false,
        error: '必須パラメータが不足しています'
      });
    }

    if (moodScore < -5 || moodScore > 5) {
      return res.status(400).json({
        success: false,
        error: 'スコアは-5から5の範囲で指定してください'
      });
    }

    // スプレッドシートに追加
    const result = await appendToSheet({
      sessionId,
      nickname,
      moodScore,
      comment: comment || '',
      emoticon: emoticon || ''
    });

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
