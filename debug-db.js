const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const sessionCount = await prisma.session.count();
        console.log(`Sessions in DB: ${sessionCount}`);

        const sessions = await prisma.session.findMany();
        console.log('Sessions:', sessions);

        const moodCount = await prisma.mood.count();
        console.log(`Total Moods in DB: ${moodCount}`);

        const demoMoods = await prisma.mood.findMany({ where: { sessionId: 'demo-1' } });
        console.log(`Moods for 'demo-1': ${demoMoods.length}`);
        if (demoMoods.length > 0) {
            console.log('Latest Mood:', demoMoods[demoMoods.length - 1]);
        }
    } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}
main();
