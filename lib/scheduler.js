const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { summarizeText } = require('./ai-service');

// 5 minutes in milliseconds
const INTERVAL_MS = 5 * 60 * 1000;

function startScheduler() {
    console.log('Starting 5-minute summarization scheduler...');

    // Run immediately on start (for dev/test), or wait?
    // Let's rely on interval.

    setInterval(async () => {
        console.log('--- Running Scheduled Summarization ---');
        await processSummaries();
    }, INTERVAL_MS);
}

async function processSummaries() {
    try {
        // 1. Get all active sessions
        const activeSessions = await prisma.session.findMany({
            where: { isActive: true }
        });

        for (const session of activeSessions) {
            // 2. Get transcripts that are NOT yet summarized? 
            // Or get transcripts from the last 5 minutes.
            // Since we DELETE raw transcripts after support, we can just get ALL existing transcripts.
            // (User agreed to delete raw data).

            const transcripts = await prisma.transcript.findMany({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'asc' }
            });

            if (transcripts.length === 0) continue;

            // Combine text
            const fullText = transcripts.map(t => `${t.speaker}: ${t.text}`).join('\n');
            const startTime = transcripts[0].createdAt;
            const endTime = transcripts[transcripts.length - 1].createdAt;

            // 3. Call AI
            console.log(`Summarizing session ${session.id} with ${transcripts.length} lines...`);
            const summaryText = await summarizeText(fullText);

            // 4. Save Summary
            await prisma.summary.create({
                data: {
                    sessionId: session.id,
                    content: summaryText,
                    startTime: startTime,
                    endTime: endTime
                }
            });

            // 5. DELETE raw transcripts (User requirement: "DBがパンパンになる... 元データ削除OK")
            await prisma.transcript.deleteMany({
                where: {
                    id: { in: transcripts.map(t => t.id) }
                }
            });

            console.log(`Saved summary for ${session.id} and deleted ${transcripts.length} raw lines.`);
        }
    } catch (error) {
        console.error('Scheduler Error:', error);
    }
}

module.exports = { startScheduler };
