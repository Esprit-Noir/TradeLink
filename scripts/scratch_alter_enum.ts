import { prisma } from './src/lib/prisma';

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING';`);
    console.log("Enum updated successfully");
  } catch(e) {
    console.error("Error executing raw SQL:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
