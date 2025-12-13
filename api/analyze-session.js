const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { analyzeMeetingData } = require('../lib/openai-service');
const { getSurveyResponses } = require('../lib/db');

module.exports = async (req, res) => {
    try {
        const { sessionId, targetLanguage } = req.body || {};

        if (!sessionId) {
            console.log('Analyze Request: Session ID missing');
            return res.status(400).json({ success: false, error: 'Session ID is required' });
        }

        const moodsRaw = await prisma.mood.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' }
        });

        const summaries = await prisma.summary.findMany({
            where: { sessionId },
            orderBy: { startTime: 'asc' }
        });

        if (moodsRaw.length === 0 && summaries.length === 0) {
            return res.status(400).json({ success: false, error: '分析するデータがありません' });
        }

        const moodData = moodsRaw.map(m => ({
            ...m,
            moodScore: m.score,
            timestamp: m.createdAt
        }));

        const surveyResponses = await getSurveyResponses(sessionId);

        const result = await analyzeMeetingData(moodData, summaries, { targetLanguage });

        res.json({
            success: true,
            data: {
                ...result,
                surveyResponses
            }
        });

    } catch (error) {
        console.error('Analyze Session Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || '分析中にエラーが発生しました'
        });
    }
};
