require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 15000,
});

async function backup() {
  try {
    console.log("Connecting to source PostgreSQL database...");
    
    // 1. Fetch all table names to ensure we don't miss anything
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const tableNames = tablesQuery.rows.map(r => r.table_name);
    console.log("Found tables in public schema:", tableNames.join(", "));
    
    const backupData = {
      timestamp: new Date().toISOString(),
      database: process.env.DATABASE_URL.split('@')[1] || 'Render Postgres',
      tables: {}
    };

    // 2. Fetch data from each table
    for (const tableName of tableNames) {
      console.log(`Exporting table '${tableName}'...`);
      
      // Determine if table has an 'id' column for ordered export
      const hasIdQuery = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'id'
      `, [tableName]);
      
      let queryText = `SELECT * FROM "${tableName}"`;
      if (hasIdQuery.rows.length > 0) {
        queryText += ' ORDER BY id ASC';
      }
      
      const result = await pool.query(queryText);
      backupData.tables[tableName] = result.rows;
      console.log(`Successfully exported ${result.rows.length} rows from '${tableName}'.`);
    }

    // 3. Write backup to a JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.json`;
    const scriptsDir = __dirname;
    const backupPath = path.join(scriptsDir, filename);
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    console.log(`\nBackup completed successfully!`);
    console.log(`Saved backup file: ${backupPath}`);
    console.log(`File size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);
    
  } catch (err) {
    console.error("Backup failed with error:", err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

backup();
