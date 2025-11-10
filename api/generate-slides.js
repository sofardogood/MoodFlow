const { generateSlides } = require('../lib/slides-generator');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 認証チェック
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です'
      });
    }

    const { sessionId, data } = req.body;

    if (!sessionId || !data) {
      return res.status(400).json({
        success: false,
        error: 'セッションIDとデータを指定してください'
      });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'データが空です'
      });
    }

    // スライドを生成
    const result = await generateSlides(sessionId, data);

    return res.status(200).json({
      success: true,
      presentationId: result.presentationId,
      slideUrl: result.slideUrl
    });

  } catch (error) {
    console.error('Generate slides error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'スライド生成エラーが発生しました'
    });
  }
};
