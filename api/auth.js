const { createUser, findUser } = require('../lib/db');

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
        const { action, email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'メールアドレスとパスワードは必須です' });
        }

        if (action === 'register') {
            const result = await createUser(email, password, name);
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } else if (action === 'login') {
            const result = await findUser(email, password);
            // For security in production, don't return specific error like "email not found"
            // But for this local tool, it helps.
            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(401).json(result);
            }
        } else {
            return res.status(400).json({ success: false, error: 'Invalid action' });
        }

    } catch (error) {
        console.error('Auth API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'サーバーエラーが発生しました'
        });
    }
};
