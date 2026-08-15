import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { evaluateChallenge } from "./src/lib/prop-firm.service";
import { prisma } from "./src/lib/prisma";

async function main() {
  const challenges = await prisma.propChallenge.findMany({ include: { account: true } });
  for (const c of challenges) {
    console.log(`Evaluating challenge: ${c.id} (${c.account.name})`);
    try {
      const res = await evaluateChallenge(c.id);
      console.log(`Result currentBalance:`, res?.currentBalance);
    } catch (e: any) {
      console.log(`Failed:`, e.message);
    }
  }
}
main().catch(console.error).finally(() => process.exit(0));
