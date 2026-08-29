/**
 * HAPPY TOOTH v2 — Apply combined_migration.sql via DATABASE_URL
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/apply_sql.js
 *
 * NEVER hardcode credentials in this file.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function applyMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set.');
    console.error('Example:');
    console.error('  DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres" node scripts/apply_sql.js');
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, 'combined_migration.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ scripts/combined_migration.sql not found.');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected. Applying combined migration...');
    await client.query(sql);
    console.log('✅ All tables, functions, RLS policies, indexes, and seed data applied.');
    return true;
  } catch (err) {
    console.error('❌ Failed:', err.message);
    return false;
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

applyMigrations().then((success) => {
  process.exit(success ? 0 : 1);
});
