const { createMood } = require('./lib/db');
const prisma = require('./lib/prisma');

async function main() {
    try {
        console.log("Attempting to insert mood...");
        const result = await createMood({
            sessionId: 'demo-1',
            nickname: 'DebugUser',
            moodScore: 3,
            comment: 'Manual Test',
            emoticon: '🧪'
        });
        console.log("Result:", result);
    } catch (e) { console.error("Insert failed:", e); }
    finally { await prisma.$disconnect(); }
}
main();
