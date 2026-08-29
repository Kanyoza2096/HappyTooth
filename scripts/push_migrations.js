/**
 * HAPPY TOOTH v2 — Push SQL migrations via DATABASE_URL (pg)
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/push_migrations.js
 *
 * Or set DATABASE_URL in .env.local and run:
 *   node --env-file=.env.local scripts/push_migrations.js
 *
 * NEVER hardcode credentials in this file.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const migrationFiles = [
  { file: path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'), label: '001 Initial Schema' },
  { file: path.join(__dirname, '..', 'supabase', 'migrations', '002_rls_policies.sql'), label: '002 RLS Policies' },
  { file: path.join(__dirname, '..', 'supabase', 'migrations', '003_functions.sql'), label: '003 Functions & Triggers' },
  { file: path.join(__dirname, '..', 'supabase', 'migrations', '004_indexes.sql'), label: '004 Indexes' },
  { file: path.join(__dirname, '..', 'supabase', 'seed.sql'), label: 'Seed Data' },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set.');
    console.error('');
    console.error('Set it to your Supabase Postgres connection string, e.g.:');
    console.error('  DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"');
    console.error('');
    console.error('Alternatively, open the Supabase SQL Editor and run scripts/combined_migration.sql manually.');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('HAPPY TOOTH v2 — Database Migration Push');
  console.log('='.repeat(60));

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    for (const m of migrationFiles) {
      if (!fs.existsSync(m.file)) {
        console.warn(`⚠️  Skipping missing file: ${m.file}`);
        continue;
      }
      const sql = fs.readFileSync(m.file, 'utf-8');
      console.log(`\n🔄 Running: ${m.label}...`);
      await client.query(sql);
      console.log(`✅ Success: ${m.label}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('DATABASE READY — schema, RLS, functions, indexes, seed applied.');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}

main();
