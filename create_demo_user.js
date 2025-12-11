const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'demo@example.com';
    const password = 'demo';

    try {
        const existing = await prisma.user.findUnique({
            where: { email }
        });

        if (existing) {
            console.log('Demo user already exists.');
        } else {
            await prisma.user.create({
                data: {
                    email,
                    password,
                    name: 'Demo User'
                }
            });
            console.log('Demo user created successfully: demo@example.com / demo');
        }
    } catch (e) {
        console.error('Error creating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
