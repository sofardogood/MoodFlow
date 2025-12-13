const prisma = require('../lib/prisma');

module.exports = async (req, res) => {
    try {
        const { interventionId, rating } = req.body;

        if (!interventionId || rating === undefined) {
            return res.status(400).json({ error: 'interventionId and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const updated = await prisma.interventionLog.update({
            where: { id: parseInt(interventionId) },
            data: { successRating: rating }
        });

        res.status(200).json({
            success: true,
            message: `Intervention ${interventionId} rated ${rating}/5`,
            data: updated
        });

    } catch (error) {
        console.error('Rate Intervention Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
