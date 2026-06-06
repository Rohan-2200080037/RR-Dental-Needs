require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runUpdate() {
  try {
    console.log("Connecting to PostgreSQL database...");
    await pool.connect();
    console.log("Connected successfully.");

    // 1. Rename existing 'category' column to 'year'
    console.log("Renaming column 'category' to 'year'...");
    await pool.query(`
      ALTER TABLE Products RENAME COLUMN category TO year
    `);
    console.log("Column renamed successfully.");

    // 2. Add new 'category' column (nullable first to allow populating it)
    console.log("Adding column 'category' to Products table...");
    await pool.query(`
      ALTER TABLE Products ADD COLUMN IF NOT EXISTS category VARCHAR(100)
    `);
    console.log("Column 'category' added.");

    // 3. Populate 'category' based on 'year' values
    console.log("Populating 'category' column based on 'year'...");
    await pool.query(`
      UPDATE Products SET category = 'permanent teeth wax carvings' WHERE year = '1st Year'
    `);
    await pool.query(`
      UPDATE Products SET category = 'preclinical prosthodontics' WHERE year = '2nd Year'
    `);
    await pool.query(`
      UPDATE Products SET category = 'primary teeth wax carvings' WHERE year = '3rd Year'
    `);
    await pool.query(`
      UPDATE Products SET category = 'Orthodontics' WHERE year = '4th Year'
    `);
    
    // Set fallback default for any other year value
    await pool.query(`
      UPDATE Products SET category = 'permanent teeth wax carvings' WHERE category IS NULL
    `);
    console.log("Data populated successfully.");

    // 4. Set 'category' column to NOT NULL
    console.log("Setting 'category' column to NOT NULL...");
    await pool.query(`
      ALTER TABLE Products ALTER COLUMN category SET NOT NULL
    `);
    console.log("Column 'category' set to NOT NULL.");

    console.log("\nDATABASE SCHEMA UPDATE AND DATA MIGRATION COMPLETED SUCCESSFULLY!");

  } catch (err) {
    console.error("Database schema update failed:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runUpdate();
