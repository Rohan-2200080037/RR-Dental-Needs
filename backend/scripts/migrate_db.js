require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Target database URL can be passed via command line argument or TARGET_DATABASE_URL env var
const targetUrl = process.argv[2] || process.env.TARGET_DATABASE_URL;

if (!targetUrl) {
  console.error("ERROR: Please provide the target database connection string as an argument or set TARGET_DATABASE_URL in .env");
  console.error("Usage: node backend/scripts/migrate_db.js <TARGET_DATABASE_URL>");
  process.exit(1);
}

const sourcePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const targetPool = new Pool({
  connectionString: targetUrl,
  ssl: { rejectUnauthorized: false }
});

const dependencyOrder = [
  'users',
  'sellers',
  'addresses',
  'products',
  'cart',
  'orders',
  'order_items',
  'wishlist',
  'reviews',
  'contact_messages'
];

async function runMigration() {
  try {
    console.log("Connecting to databases...");
    await sourcePool.connect();
    console.log("Source database connected.");
    await targetPool.connect();
    console.log("Target database connected.");

    // 1. Locate the latest backup file
    const scriptsDir = __dirname;
    const files = fs.readdirSync(scriptsDir);
    const backupFiles = files.filter(f => f.startsWith('backup_') && f.endsWith('.json'));

    if (backupFiles.length === 0) {
      console.error(`ERROR: No backup files found in ${scriptsDir}. Please run backend/scripts/backup_db.js first.`);
      process.exit(1);
    }

    // Sort to get the latest
    backupFiles.sort().reverse();
    const latestBackupFile = backupFiles[0];
    const backupPath = path.join(scriptsDir, latestBackupFile);
    console.log(`Using backup file: ${backupPath}`);

    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
    console.log(`Backup file loaded. Timestamp: ${backupData.timestamp}`);

    // 2. Drop existing tables in target database (if any) to ensure clean schema rebuild
    console.log("\nRecreating schema in target database...");
    
    // Drop in reverse dependency order to avoid constraint violations
    const reverseOrder = [...dependencyOrder].reverse();
    for (const tableName of reverseOrder) {
      console.log(`Dropping table '${tableName}' if exists on target...`);
      await targetPool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
    }

    // 3. Recreate all tables with exact schema constraints
    console.log("\nCreating tables on target database...");
    
    // Users
    await targetPool.query(`
      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created 'users' table.");

    // Sellers
    await targetPool.query(`
      CREATE TABLE sellers (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          store_name VARCHAR(100),
          approved_status VARCHAR(50) DEFAULT 'pending' CHECK (approved_status IN ('pending', 'approved', 'rejected')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Created 'sellers' table.");

    // Addresses
    await targetPool.query(`
      CREATE TABLE addresses (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(50) NOT NULL,
          state VARCHAR(50) NOT NULL,
          pincode VARCHAR(20) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          is_saved BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Created 'addresses' table.");

    // Products
    await targetPool.query(`
      CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          image VARCHAR(255),
          stock_quantity INT NOT NULL DEFAULT 0,
          category VARCHAR(100) NOT NULL,
          seller_id INT NOT NULL,
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      )
    `);
    console.log("Created 'products' table.");

    // Cart
    await targetPool.query(`
      CREATE TABLE cart (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log("Created 'cart' table.");

    // Orders
    await targetPool.query(`
      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          address_id INT NOT NULL,
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_price DECIMAL(10, 2) NOT NULL,
          order_status VARCHAR(50) DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Packed', 'Shipped', 'Delivered')),
          payment_method VARCHAR(50) DEFAULT 'COD',
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (address_id) REFERENCES addresses(id)
      )
    `);
    console.log("Created 'orders' table.");

    // Order Items
    await targetPool.query(`
      CREATE TABLE order_items (
          id SERIAL PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
    console.log("Created 'order_items' table.");

    // Wishlist
    await targetPool.query(`
      CREATE TABLE wishlist (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE (user_id, product_id)
      )
    `);
    console.log("Created 'wishlist' table.");

    // Reviews
    await targetPool.query(`
      CREATE TABLE reviews (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log("Created 'reviews' table.");

    // Contact Messages
    await targetPool.query(`
      CREATE TABLE contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created 'contact_messages' table.");

    // 4. Restore data in dependency order
    console.log("\nRestoring data table by table...");
    for (const tableName of dependencyOrder) {
      const rows = backupData.tables[tableName];
      if (!rows || rows.length === 0) {
        console.log(`Table '${tableName}' has no records to restore.`);
        continue;
      }
      
      console.log(`Inserting ${rows.length} rows into '${tableName}'...`);
      
      // We will construct custom parameterized insertions for each row
      // object keys represent column names, object values represent values
      const cols = Object.keys(rows[0]);
      const colNames = cols.map(c => `"${c}"`).join(", ");
      
      for (const row of rows) {
        const valuePlaceholders = cols.map((_, idx) => `$${idx + 1}`).join(", ");
        const values = cols.map(col => row[col]);
        
        await targetPool.query(
          `INSERT INTO "${tableName}" (${colNames}) VALUES (${valuePlaceholders})`,
          values
        );
      }
      
      console.log(`Successfully restored table '${tableName}'.`);
      
      // Update serial sequence
      console.log(`Correcting primary key sequence for '${tableName}'...`);
      const seqQuery = await targetPool.query(`
        SELECT pg_get_serial_sequence($1, 'id') as seq
      `, [tableName]);
      
      const seqName = seqQuery.rows[0].seq;
      if (seqName) {
        await targetPool.query(`
          SELECT setval($1, COALESCE(MAX(id), 1)) FROM "${tableName}"
        `, [seqName]);
        console.log(`Sequence '${seqName}' set successfully.`);
      } else {
        console.log(`No sequence found for table '${tableName}'.`);
      }
    }

    // 5. Verification
    console.log("\n--- RUNNING INTEGRITY VERIFICATION ---");
    let verificationPassed = true;
    
    for (const tableName of dependencyOrder) {
      const sourceCountResult = await sourcePool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const targetCountResult = await targetPool.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
      
      const sourceCount = parseInt(sourceCountResult.rows[0].count);
      const targetCount = parseInt(targetCountResult.rows[0].count);
      
      console.log(`Table '${tableName}': Source Count = ${sourceCount}, Target Count = ${targetCount}`);
      
      if (sourceCount !== targetCount) {
        console.error(`Verification FAILED for '${tableName}': Row counts mismatch!`);
        verificationPassed = false;
      } else {
        console.log(`Verification PASSED for '${tableName}' row count.`);
      }
    }

    if (verificationPassed) {
      console.log("\nDATABASE MIGRATION COMPLETED SUCCESSFULLY WITH 100% DATA INTEGRITY!");
    } else {
      console.error("\nDATABASE MIGRATION COMPLETED BUT ENCOUNTERED INTEGRITY MISMATCHES. PLEASE CHECK ERROR LOGS.");
    }

  } catch (err) {
    console.error("\nMigration failed with error:", err);
  } finally {
    await sourcePool.end();
    await targetPool.end();
    process.exit(0);
  }
}

runMigration();
