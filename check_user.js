const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'demo@example.com' }
        });
        console.log('--- USER CHECK RESULT ---');
        if (user) {
            console.log(`User FOUND: ${user.email} (ID: ${user.id})`);
        } else {
            console.log('User NOT FOUND');
        }
    } catch (e) {
        console.error('Database Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
