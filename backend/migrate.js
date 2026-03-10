const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sreeju/odontic store V.10.3/backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function migrate() {
    try {
        await pool.query('ALTER TABLE Users ADD COLUMN IF NOT EXISTS reset_token TEXT, ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;');
        console.log('Migration successful');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}
migrate();
