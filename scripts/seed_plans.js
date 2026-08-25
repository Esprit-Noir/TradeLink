const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    
    // Check if plans exist
    const { rowCount } = await client.query('SELECT 1 FROM plans LIMIT 1');
    if (rowCount > 0) {
      console.log("Plans already exist, skipping seed.");
      return;
    }
    
    const now = new Date().toISOString();
    
    const plans = [
      {
        id: crypto.randomUUID(),
        name: 'Standard',
        price: 19.99,
        maxAccounts: 1,
        maxTradesPerMonth: 100,
        backtestAccess: false,
        isActive: true,
        features: JSON.stringify({}),
        created_at: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Pro',
        price: 49.99,
        maxAccounts: 3,
        maxTradesPerMonth: null,
        backtestAccess: true,
        isActive: true,
        features: JSON.stringify({ replayAccess: true, advancedStats: true }),
        created_at: now
      },
      {
        id: crypto.randomUUID(),
        name: 'Elite',
        price: 99.99,
        maxAccounts: 10,
        maxTradesPerMonth: null,
        backtestAccess: true,
        isActive: true,
        features: JSON.stringify({ replayAccess: true, advancedStats: true, propFirmAccess: true }),
        created_at: now
      }
    ];

    for (const p of plans) {
      await client.query(`
        INSERT INTO plans (id, name, price, max_accounts, max_trades_per_month, backtest_access, is_active, features, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [p.id, p.name, p.price, p.maxAccounts, p.maxTradesPerMonth, p.backtestAccess, p.isActive, p.features, p.created_at]);
    }
    
    console.log("Seeded 3 plans successfully!");
  } catch(e) {
    console.error("Error seeding plans:", e);
  } finally {
    await client.end();
  }
}
main();
