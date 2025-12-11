const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// In a real app, we would get userId from the session/token.
// For this local tool, we trust the client to send the user ID (passed as 'x-user-id' header or query param).
// Security Warning: This is NOT secure for production.
const getUserId = (req) => {
    const uid = req.headers['x-user-id'] || req.query.userId || (req.body && req.body.userId);
    return uid ? parseInt(uid, 10) : null;
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const userId = getUserId(req);
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized: User ID required' });
    }

    try {
        if (req.method === 'GET') {
            // List sessions for this user
            const sessions = await prisma.session.findMany({
                where: { ownerId: userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { moods: true, transcripts: true }
                    }
                }
            });
            return res.status(200).json({ success: true, sessions });
        }

        if (req.method === 'POST') {
            // Create new session
            const { name } = req.body;
            const session = await prisma.session.create({
                data: {
                    name: name || `Session ${new Date().toISOString()}`,
                    ownerId: userId
                }
            });
            return res.status(200).json({ success: true, session });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (error) {
        console.error('My Sessions API Error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};
