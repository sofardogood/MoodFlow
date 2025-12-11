const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Demo Session ---');

    try {
        // Upsert demo-1 session
        const session = await prisma.session.upsert({
            where: { id: 'demo-1' },
            update: {},
            create: {
                id: 'demo-1',
                name: 'デモセッション (Demo)',
                isActive: true
            }
        });

        console.log('✅ Session ensured:', session);

        // Also ensure a Demo User exists for ownership if needed
        // (Assuming ownerId is optional in Session, checking schema...)
        // Schema: ownerId Int? -> Optional. OK.

    } catch (e) {
        console.error('❌ Seeding Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
