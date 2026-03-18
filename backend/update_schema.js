require('dotenv').config();
const pool = require('./db');

async function updateSchema() {
    try {
        // Add is_saved column to Addresses if it doesn't exist
        await pool.query(`
            ALTER TABLE Addresses 
            ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT TRUE;
        `);
        console.log("SCHEMA_INFO: is_saved column ensured on Addresses table.");

        process.exit(0);
    } catch (err) {
        console.error("FULL ERROR:", err);
        process.exit(1);
    }
}

updateSchema();
