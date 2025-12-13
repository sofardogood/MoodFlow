const { HumorOrchestrator } = require('../lib/humor-agents');
const prisma = require('../lib/prisma');

module.exports = async (req, res) => {
    try {
        const { context, sessionId } = req.body;

        if (!context) {
            return res.status(400).json({ error: 'Context is required' });
        }

        const orchestrator = new HumorOrchestrator();
        const result = await orchestrator.intervene(context);

        // Log the intervention to DB for future learning (non-blocking)
        let interventionId = null;
        try {
            const log = await prisma.interventionLog.create({
                data: {
                    sessionId: sessionId || null,
                    context: context,
                    dialogue: result.advice, // Store advice as dialogue field
                    suggestion: result.warning,
                    successRating: null
                }
            });
            interventionId = log.id;
        } catch (dbError) {
            console.warn("Failed to log intervention:", dbError.message);
        }

        res.status(200).json({
            success: true,
            interventionId: interventionId,
            data: {
                dialect: result.dialect,
                agentUsed: result.agentUsed,
                advice: result.advice,
                warning: result.warning
            }
        });

    } catch (error) {
        console.error('Humor Intervention Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
