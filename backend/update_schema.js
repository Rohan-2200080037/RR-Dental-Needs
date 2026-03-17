const pool = require('./db');
require('dotenv').config();

async function updateSchema() {
    try {
        // Check nullability of user_id
        const nullCheck = await pool.query(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE lower(table_name) = 'addresses' AND lower(column_name) = 'user_id';
        `);

        if (nullCheck.rows.length > 0) {
            console.log("SCHEMA_INFO: user_id is_nullable =", nullCheck.rows[0].is_nullable);
        } else {
            console.log("SCHEMA_INFO: user_id column not found or table name different.");
        }

        process.exit(0);
    } catch (err) {
        console.error("FULL ERROR:", err);
        process.exit(1);
    }
}

updateSchema();
