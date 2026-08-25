const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING';`);
    console.log("Enum updated successfully");
  } catch(e) {
    console.error("Error executing raw SQL:", e);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
