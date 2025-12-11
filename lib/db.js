const prisma = require('./prisma');

// Add mood data
async function createMood(data) {
    const { sessionId, nickname, moodScore, comment, emoticon } = data;

    try {
        // Ensure session exists or find it
        // For simplicity, we assume session ID is passed.
        // However, if strict FK is enforced, we need a session record.
        // For this migration, we will upsert the session to ensure it exists.

        // Check if valid UUID or just a string. Old code used "meeting-001" which is not UUID.
        // Prisma uuid() expects UUIDs usually, but string ID is flexible if defined as String.

        // We update Schema to allow arbitrary strings or we handle "Session" creation on the fly.
        // Let's safe-guard by upserting session.

        await prisma.session.upsert({
            where: { id: sessionId },
            update: {},
            create: {
                id: sessionId,
                name: 'Auto-created Session'
            }
        });

        const mood = await prisma.mood.create({
            data: {
                sessionId,
                nickname,
                score: moodScore,
                comment: comment || '',
                emoticon: emoticon || '',
            }
        });

        return { success: true, timestamp: mood.createdAt };
    } catch (error) {
        console.error('DB Create Mood Error:', error);
        throw new Error('データベースへの保存に失敗しました');
    }
}

// Get session data
async function getMoods(sessionId) {
    try {
        const moods = await prisma.mood.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
            select: {
                createdAt: true,
                sessionId: true,
                nickname: true,
                score: true,
                emoticon: true,
                comment: true
            }
        });

        return moods.map(m => ({
            timestamp: m.createdAt.toISOString(),
            sessionId: m.sessionId,
            nickname: m.nickname,
            moodScore: m.score,
            emoticon: m.emoticon,
            comment: m.comment
        }));
    } catch (error) {
        console.error('DB Read Error:', error);
        throw new Error('データベースからの読み込みに失敗しました');
    }
}

// Add transcript
async function createTranscript(data) {
    const { sessionId, text, speaker } = data;
    try {
        await prisma.session.upsert({
            where: { id: sessionId },
            update: {},
            create: { id: sessionId, name: 'Auto-created Session' }
        });

        const transcript = await prisma.transcript.create({
            data: {
                sessionId,
                text,
                speaker: speaker || 'Presenter'
            }
        });
        return { success: true, timestamp: transcript.createdAt };
    } catch (error) {
        console.error('DB Create Transcript Error:', error);
        throw new Error('書き起こしの保存に失敗しました');
    }
}

// Get combined data for visualization
async function getVisualData(sessionId) {
    try {
        const [moods, transcripts] = await Promise.all([
            prisma.mood.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'asc' }, // Ascending for timeline
                select: {
                    createdAt: true,
                    score: true,
                    emoticon: true,
                    comment: true,
                    nickname: true
                }
            }),
            prisma.transcript.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'asc' },
                select: {
                    createdAt: true,
                    text: true,
                    speaker: true
                }
            })
        ]);

        return {
            moods: moods.map(m => ({
                timestamp: m.createdAt.toISOString(),
                score: m.score,
                emoticon: m.emoticon,
                comment: m.comment,
                nickname: m.nickname
            })),
            transcripts: transcripts.map(t => ({
                timestamp: t.createdAt.toISOString(),
                text: t.text,
                speaker: t.speaker
            }))
        };
    } catch (error) {
        console.error('DB Get Visual Data Error:', error);
        throw new Error('データの取得に失敗しました');
    }
}

// Get all data (for admin)
async function getAllMoods() {
    try {
        const moods = await prisma.mood.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                createdAt: true,
                sessionId: true,
                nickname: true,
                score: true,
                emoticon: true,
                comment: true
            }
        });

        return moods.map(m => ({
            timestamp: m.createdAt.toISOString(),
            sessionId: m.sessionId,
            nickname: m.nickname,
            moodScore: m.score,
            emoticon: m.emoticon,
            comment: m.comment
        }));
    } catch (error) {
        console.error('DB Read All Error:', error);
        throw new Error('データ全件取得に失敗しました');
    }
}

// User management
async function createUser(email, password, name) {
    try {
        const user = await prisma.user.create({
            data: {
                email,
                password, // NOTE: In production, hash this!
                name: name || email.split('@')[0]
            }
        });
        return { success: true, user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
        if (error.code === 'P2002') {
            return { success: false, error: 'このメールアドレスは既に登録されています' };
        }
        console.error('Create User Error:', error);
        throw new Error('ユーザー作成に失敗しました');
    }
}

async function findUser(email, password) {
    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || user.password !== password) {
            return { success: false, error: 'メールアドレスまたはパスワードが間違っています' };
        }

        return { success: true, user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
        console.error('Find User Error:', error);
        throw new Error('ログイン処理に失敗しました');
    }
}

module.exports = {
    createMood,
    getMoods,
    getAllMoods,
    createTranscript,
    getVisualData,
    createUser,
    findUser
};
