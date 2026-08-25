const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();
    await client.query(`ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING';`);
    console.log("Enum updated successfully via pg");
  } catch(e) {
    console.error("Error executing raw SQL:", e);
  } finally {
    await client.end();
  }
}

main();
