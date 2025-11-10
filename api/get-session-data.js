const { getSessionData } = require('../lib/sheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 簡易的な認証チェック
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '認証が必要です'
      });
    }

    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'セッションIDを指定してください'
      });
    }

    // スプレッドシートからデータを取得
    const data = await getSessionData(sessionId);

    return res.status(200).json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Get session data error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'データ取得エラーが発生しました'
    });
  }
};
