require('dotenv').config();
const pool = require('./db');

async function fixDB() {
    try {
        await pool.query(`
            ALTER TABLE Users 
            ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
            ADD COLUMN IF NOT EXISTS reset_password_expire TIMESTAMP;
        `);
        console.log("Added columns for reset password to Users table successfully.");
    } catch (e) {
        console.error("Error updating schema:", e);
    }
    process.exit(0);
}

fixDB();
