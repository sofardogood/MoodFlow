const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeMeetingData } = require('../lib/openai-service');

module.exports = async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            console.log('Analyze Request: Session ID missing');
            return res.status(400).json({ success: false, error: 'Session ID is required' });
        }

        console.log(`Analyzing session: ${sessionId}`);

        // 1. Fetch Moods (Reactions/Comments)
        const moods = await prisma.mood.findMany({
            where: { sessionId: sessionId },
            orderBy: { createdAt: 'asc' }
        });

        // 2. Fetch Summaries (Conversation Logs)
        const summaries = await prisma.summary.findMany({
            where: { sessionId: sessionId },
            orderBy: { startTime: 'asc' }
        });

        if (moods.length === 0 && summaries.length === 0) {
            return res.status(400).json({ success: false, error: '分析するデータ（反応や会話ログ）がありません' });
        }

        // 3. Call OpenAI Analysis
        const result = await analyzeMeetingData(moods, summaries);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Analyze Session Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '分析中にエラーが発生しました'
        });
    }
};
