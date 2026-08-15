import { prisma } from "./src/lib/prisma";
async function main() {
  const c = await prisma.propChallenge.findMany();
  console.log(c.map(x => ({ id: x.id, initial: x.initialBalance, current: x.currentBalance })));
}
main().catch(console.error).finally(() => process.exit(0));
