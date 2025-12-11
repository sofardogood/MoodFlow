const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = async (req, res) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'Session ID is required' });
        }

        const summaries = await prisma.summary.findMany({
            where: { sessionId: sessionId },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            summaries: summaries
        });
    } catch (error) {
        console.error('Get summaries error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
