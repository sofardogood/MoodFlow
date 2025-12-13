const { createTranscript } = require('../lib/db');

module.exports = async (req, res) => {
    // CORS configuration
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
        const { sessionId, text, speaker, tag, language } = req.body;

        // Validation
        if (!sessionId || !text) {
            return res.status(400).json({
                success: false,
                error: 'セッションIDとテキストは必須です'
            });
        }

        // Save to DB
        const result = await createTranscript({
            sessionId,
            text,
            speaker: speaker || 'Presenter',
            tag,
            language
        });

        return res.status(200).json({
            success: true,
            timestamp: result.timestamp
        });

    } catch (error) {
        console.error('Submit transcript error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'サーバーエラーが発生しました'
        });
    }
};
