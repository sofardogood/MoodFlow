const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // Use global singleton in production usually, but this is fine for now

module.exports = async (req, res) => {
    const { sessionId } = req.query;
    const { action } = req.body || {}; // action: 'start' | 'end'

    if (!sessionId) {
        return res.status(400).json({ success: false, error: 'Missing sessionId' });
    }

    try {
        if (req.method === 'GET') {
            // Check status
            const session = await prisma.session.findUnique({
                where: { id: sessionId }
            });
            if (!session) {
                return res.json({ success: true, isActive: false, exists: false });
            }
            return res.json({ success: true, isActive: session.isActive, exists: true, endedAt: session.endTime });
        } else if (req.method === 'POST') {
            if (action === 'start') {
                // Upsert session
                await prisma.session.upsert({
                    where: { id: sessionId },
                    update: { isActive: true },
                    create: { id: sessionId, name: sessionId, isActive: true }
                });
                return res.json({ success: true, message: 'Session started' });
            } else if (action === 'end') {
                await prisma.session.upsert({
                    where: { id: sessionId },
                    update: { isActive: false },
                    create: { id: sessionId, name: sessionId, isActive: false }
                });
                return res.json({ success: true, message: 'Session ended' });
            } else {
                return res.status(400).json({ success: false, error: 'Invalid action' });
            }
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Session API Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
