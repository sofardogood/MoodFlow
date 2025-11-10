const crypto = require('crypto');

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
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'パスワードを入力してください'
      });
    }

    // 環境変数のパスワードと比較
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      return res.status(500).json({
        success: false,
        error: '管理者パスワードが設定されていません'
      });
    }

    if (password !== correctPassword) {
      return res.status(401).json({
        success: false,
        error: 'パスワードが正しくありません'
      });
    }

    // 簡易的なトークンを生成
    const token = crypto.randomBytes(32).toString('hex');

    // Note: 本番環境では、トークンをデータベースやRedisに保存して管理すべき
    // ここでは簡易実装として、トークンをそのまま返す

    return res.status(200).json({
      success: true,
      token: token
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'ログインエラーが発生しました'
    });
  }
};
