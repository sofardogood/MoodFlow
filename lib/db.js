const prisma = require('./prisma');
const crypto = require('crypto');

function hashNickname(sessionId, nickname) {
    if (!sessionId || !nickname) return null;
    return crypto.createHash('sha256').update(`${sessionId}:${nickname}`).digest('hex');
}

async function ensureSession(sessionId) {
    return prisma.session.upsert({
        where: { id: sessionId },
        update: {},
        create: { id: sessionId, name: 'Auto-created Session' }
    });
}

// Mood CRUD
async function createMood(data) {
    const { sessionId, nickname, moodScore, comment, emoticon, translatedComment, language, tag, role, department, theme } = data;
    try {
        await ensureSession(sessionId);
        const mood = await prisma.mood.create({
            data: {
                sessionId,
                nickname,
                hashedNickname: hashNickname(sessionId, nickname),
                score: moodScore,
                comment: comment || '',
                translatedComment: translatedComment || null,
                language: language || 'ja',
                tag: tag || null,
                role: role || null,
                department: department || null,
                theme: theme || null,
                emoticon: emoticon || '',
            }
        });
        return { success: true, timestamp: mood.createdAt };
    } catch (error) {
        console.error('DB Create Mood Error:', error);
        throw new Error('リアクションの保存に失敗しました');
    }
}

async function applyOverrides(moods, transcripts, overrides) {
    if (!overrides || overrides.length === 0) return { moods, transcripts };
    const tagBySource = new Map();
    overrides.forEach(o => tagBySource.set(`${o.sourceType}:${o.sourceId}`, o.tag));

    const patchedMoods = moods.map(m => {
        const key = `mood:${m.id}`;
        const override = tagBySource.get(key);
        return {
            ...m,
            tag: override || m.tag
        };
    });

    const patchedTranscripts = transcripts.map(t => {
        const key = `transcript:${t.id}`;
        const override = tagBySource.get(key);
        return { ...t, tag: override || t.tag };
    });

    return { moods: patchedMoods, transcripts: patchedTranscripts };
}

async function getMoods(sessionId) {
    try {
        const [moods, overrides] = await Promise.all([
            prisma.mood.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.tagOverride.findMany({ where: { sessionId, sourceType: 'mood' } })
        ]);

        const patched = (await applyOverrides(moods, [], overrides)).moods;

        return patched.map(m => ({
            id: m.id,
            timestamp: m.createdAt.toISOString(),
            sessionId: m.sessionId,
            nickname: m.nickname,
            hashedNickname: m.hashedNickname,
            moodScore: m.score,
            emoticon: m.emoticon,
            comment: m.comment,
            translatedComment: m.translatedComment,
            language: m.language,
            tag: m.tag,
            role: m.role,
            department: m.department,
            theme: m.theme
        }));
    } catch (error) {
        console.error('DB Read Error:', error);
        throw new Error('リアクションの取得に失敗しました');
    }
}

// Transcript
async function createTranscript(data) {
    const { sessionId, text, speaker, tag, language } = data;
    try {
        await ensureSession(sessionId);
        const transcript = await prisma.transcript.create({
            data: {
                sessionId,
                text,
                speaker: speaker || 'Presenter',
                tag: tag || null,
                language: language || 'ja'
            }
        });
        return { success: true, timestamp: transcript.createdAt };
    } catch (error) {
        console.error('DB Create Transcript Error:', error);
        throw new Error('発言ログの保存に失敗しました');
    }
}

// Visual bundle (moods + transcripts + questions + highlights)
async function getVisualData(sessionId) {
    try {
        const [moods, transcripts, overrides, questions, highlights] = await Promise.all([
            prisma.mood.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'asc' }
            }),
            prisma.transcript.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'asc' }
            }),
            prisma.tagOverride.findMany({ where: { sessionId } }),
            prisma.question.findMany({
                where: { sessionId },
                orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
                include: {
                    _count: { select: { votes: true } }
                }
            }),
            prisma.highlight.findMany({
                where: { sessionId },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        const { moods: patchedMoods, transcripts: patchedTranscripts } = await applyOverrides(moods, transcripts, overrides);

        return {
            moods: patchedMoods.map(m => ({
                id: m.id,
                timestamp: m.createdAt.toISOString(),
                score: m.score,
                emoticon: m.emoticon,
                comment: m.comment,
                translatedComment: m.translatedComment,
                language: m.language,
                tag: m.tag,
                nickname: m.nickname,
                role: m.role,
                department: m.department,
                theme: m.theme
            })),
            transcripts: patchedTranscripts.map(t => ({
                id: t.id,
                timestamp: t.createdAt.toISOString(),
                text: t.text,
                speaker: t.speaker,
                tag: t.tag,
                language: t.language
            })),
            questions: questions.map(q => ({
                id: q.id,
                text: q.text,
                status: q.status,
                createdAt: q.createdAt.toISOString(),
                voteCount: q._count.votes
            })),
            highlights: highlights.map(h => ({
                id: h.id,
                text: h.text,
                tag: h.tag,
                sourceType: h.sourceType,
                sourceId: h.sourceId,
                createdAt: h.createdAt.toISOString()
            }))
        };
    } catch (error) {
        console.error('DB Get Visual Data Error:', error);
        throw new Error('可視化データの取得に失敗しました');
    }
}

async function getAllMoods() {
    try {
        const moods = await prisma.mood.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return moods.map(m => ({
            id: m.id,
            timestamp: m.createdAt.toISOString(),
            sessionId: m.sessionId,
            nickname: m.nickname,
            hashedNickname: m.hashedNickname,
            moodScore: m.score,
            emoticon: m.emoticon,
            comment: m.comment,
            translatedComment: m.translatedComment,
            language: m.language,
            tag: m.tag,
            role: m.role,
            department: m.department,
            theme: m.theme
        }));
    } catch (error) {
        console.error('DB Read All Error:', error);
        throw new Error('全リアクション取得に失敗しました');
    }
}

// User management
async function createUser(email, password, name) {
    try {
        const user = await prisma.user.create({
            data: {
                email,
                password, // NOTE: hash in production
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
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.password !== password) {
            return { success: false, error: 'メールまたはパスワードが正しくありません' };
        }
        return { success: true, user: { id: user.id, email: user.email, name: user.name } };
    } catch (error) {
        console.error('Find User Error:', error);
        throw new Error('ユーザー検索に失敗しました');
    }
}

// Survey
async function createSurveyResponse(data) {
    const { sessionId, nickname, role, department, satisfaction, positive, improvement } = data;
    try {
        await ensureSession(sessionId);
        const response = await prisma.surveyResponse.create({
            data: {
                sessionId,
                nickname: nickname || null,
                hashedNickname: hashNickname(sessionId, nickname || ''),
                role: role || null,
                department: department || null,
                satisfaction: satisfaction !== undefined ? satisfaction : null,
                positive: positive || null,
                improvement: improvement || null
            }
        });
        return { success: true, timestamp: response.createdAt };
    } catch (error) {
        console.error('Create Survey Error:', error);
        throw new Error('アンケート保存に失敗しました');
    }
}

async function getSurveyResponses(sessionId) {
    try {
        return await prisma.surveyResponse.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Read Survey Error:', error);
        throw new Error('アンケート取得に失敗しました');
    }
}

// Questions
async function createQuestion({ sessionId, nickname, text }) {
    await ensureSession(sessionId);
    return prisma.question.create({
        data: {
            sessionId,
            nickname: nickname || null,
            hashedNickname: hashNickname(sessionId, nickname || ''),
            text,
            status: 'open'
        }
    });
}

async function voteQuestion({ questionId, sessionId, nickname }) {
    const hashedNickname = hashNickname(sessionId, nickname || '');
    // prevent duplicate votes by same hash
    const existing = await prisma.questionVote.findFirst({
        where: { questionId, hashedNickname }
    });
    if (existing) return { success: true, skipped: true };
    await prisma.questionVote.create({ data: { questionId, hashedNickname } });
    return { success: true };
}

async function listQuestions(sessionId) {
    const questions = await prisma.question.findMany({
        where: { sessionId },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: { _count: { select: { votes: true } } }
    });
    return questions.map(q => ({
        id: q.id,
        text: q.text,
        status: q.status,
        voteCount: q._count.votes,
        createdAt: q.createdAt.toISOString()
    }));
}

async function setQuestionStatus(questionId, status) {
    return prisma.question.update({
        where: { id: questionId },
        data: { status }
    });
}

// Tag overrides
async function upsertTagOverride({ sessionId, sourceType, sourceId, tag }) {
    await prisma.tagOverride.deleteMany({ where: { sessionId, sourceType, sourceId } });
    return prisma.tagOverride.create({ data: { sessionId, sourceType, sourceId, tag } });
}

async function getTagOverrides(sessionId) {
    return prisma.tagOverride.findMany({ where: { sessionId } });
}

// Highlights
async function createHighlight({ sessionId, text, tag, sourceType, sourceId }) {
    await ensureSession(sessionId);
    return prisma.highlight.create({
        data: {
            sessionId,
            text,
            tag: tag || null,
            sourceType: sourceType || null,
            sourceId: sourceId || null
        }
    });
}

async function getHighlights(sessionId) {
    const highlights = await prisma.highlight.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' }
    });
    return highlights.map(h => ({
        id: h.id,
        text: h.text,
        tag: h.tag,
        sourceType: h.sourceType,
        sourceId: h.sourceId,
        createdAt: h.createdAt.toISOString()
    }));
}

// Analytics helpers
async function getRecentMoods(sessionId, minutes = 10) {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return prisma.mood.findMany({
        where: { sessionId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' }
    });
}

async function getCohortStats(sessionId) {
    const moods = await prisma.mood.findMany({ where: { sessionId } });
    const surveys = await prisma.surveyResponse.findMany({ where: { sessionId } });
    const groupBy = (list, key) => {
        const map = {};
        list.forEach(item => {
            const k = item[key] || 'unknown';
            if (!map[k]) map[k] = [];
            map[k].push(item);
        });
        return map;
    };

    const calc = items => {
        if (!items.length) return { count: 0, average: 0 };
        const scores = items.map(i => i.score ?? i.moodScore ?? 0);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return { count: items.length, average: avg };
    };

    const roleStats = {};
    Object.entries(groupBy(moods, 'role')).forEach(([k, list]) => roleStats[k] = calc(list));
    const deptStats = {};
    Object.entries(groupBy(moods, 'department')).forEach(([k, list]) => deptStats[k] = calc(list));

    const surveyRole = {};
    Object.entries(groupBy(surveys, 'role')).forEach(([k, list]) => {
        const sats = list.filter(i => i.satisfaction !== null && i.satisfaction !== undefined).map(i => i.satisfaction);
        const avg = sats.length ? sats.reduce((a, b) => a + b, 0) / sats.length : null;
        surveyRole[k] = { count: list.length, avgSatisfaction: avg };
    });

    return { roleStats, deptStats, surveyRole };
}

async function getSessionStats(sessionId) {
    const moods = await prisma.mood.findMany({ where: { sessionId } });
    if (moods.length === 0) return null;
    const scores = moods.map(m => m.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const positive = scores.filter(s => s > 0).length;
    const negative = scores.filter(s => s < 0).length;
    return {
        sessionId,
        count: moods.length,
        average: avg,
        positiveRate: positive / moods.length,
        negativeRate: negative / moods.length
    };
}

async function compareSessions(sessionIds = []) {
    let ids = sessionIds;
    if (!ids.length) {
        const recent = await prisma.session.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
        ids = recent.map(s => s.id);
    }
    const stats = [];
    for (const id of ids) {
        const st = await getSessionStats(id);
        if (st) stats.push(st);
    }
    return stats;
}

async function getExportData(sessionId) {
    const [moods, transcripts, surveys, questions, highlights] = await Promise.all([
        prisma.mood.findMany({ where: { sessionId } }),
        prisma.transcript.findMany({ where: { sessionId } }),
        prisma.surveyResponse.findMany({ where: { sessionId } }),
        prisma.question.findMany({ where: { sessionId }, include: { votes: true } }),
        prisma.highlight.findMany({ where: { sessionId } })
    ]);
    return { moods, transcripts, surveys, questions, highlights };
}

module.exports = {
    hashNickname,
    ensureSession,
    createMood,
    getMoods,
    getAllMoods,
    createTranscript,
    getVisualData,
    createUser,
    findUser,
    createSurveyResponse,
    getSurveyResponses,
    getRecentMoods,
    createQuestion,
    voteQuestion,
    listQuestions,
    setQuestionStatus,
    upsertTagOverride,
    getTagOverrides,
    createHighlight,
    getHighlights,
    getCohortStats,
    compareSessions,
    getExportData,
    getSessionStats
};
