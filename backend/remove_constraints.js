require('dotenv').config();
const pool = require('./db.js');

async function removeConstraints() {
  try {
    console.log("Checking check constraints on orders table...");
    const res = await pool.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'orders'::regclass AND contype = 'c';
    `);
    
    for (let row of res.rows) {
      console.log(`Dropping constraint ${row.conname}...`);
      await pool.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS ${row.conname}`);
    }
    
    console.log("Adding updated check constraint to allow 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'...");
    await pool.query(`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_order_status_check 
      CHECK (order_status IN ('Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'));
    `);

    console.log("Constraints updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating constraints:", err);
    process.exit(1);
  }
}

removeConstraints();
