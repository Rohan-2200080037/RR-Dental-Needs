require('dotenv').config();
const pool = require('./db');

async function diagnose() {
    try {
        console.log("--- START DIAGNOSIS ---");
        
        // 1. Check table structure
        console.log("Checking table structure for 'addresses'...");
        const columns = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE lower(table_name) = 'addresses'
        `);
        console.log("Columns found:", columns.rows.map(c => `${c.column_name} (${c.data_type}, null=${c.is_nullable})`).join(", "));

        // 2. Try simple update
        console.log("Testing ALTER TABLE ADD COLUMN...");
        try {
            await pool.query('ALTER TABLE Addresses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE');
            console.log("ALTER TABLE SUCCESS");
        } catch (e) {
            console.error("ALTER TABLE FAILED:", e.message);
        }

        // 3. Check for existing data
        const oneAddr = await pool.query('SELECT * FROM Addresses LIMIT 1');
        if (oneAddr.rows.length > 0) {
            console.log("First address user_id type:", typeof oneAddr.rows[0].user_id);
            console.log("First address ID:", oneAddr.rows[0].id);
        }

        console.log("--- END DIAGNOSIS ---");
        process.exit(0);
    } catch (err) {
        console.error("DIAGNOSIS_FATAL_ERROR", err);
        process.exit(1);
    }
}

diagnose();
