import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { prisma } from "./src/lib/prisma";
async function main() {
  const c = await prisma.propChallenge.findMany();
  console.log(c.map(x => ({ id: x.id, accId: x.accountId, initial: x.initialBalance, current: x.currentBalance })));
}
main().catch(console.error).finally(() => process.exit(0));
