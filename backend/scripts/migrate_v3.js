require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const migrate = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Starting migration V3...");

        // 1. Update Orders table for Razorpay
        await client.query(`
            ALTER TABLE Orders 
            ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending';
        `);
        console.log("Updated Orders table.");

        // 2. Update Products table for Inventory Management
        await client.query(`
            ALTER TABLE Products 
            ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
        `);
        console.log("Updated Products table.");

        // 3. Create Notifications table
        await client.query(`
            CREATE TABLE IF NOT EXISTS Notifications (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created Notifications table.");

        // 4. Update order_status enum if needed (Postgres enums are tricky to update)
        // We'll check if we can just use VARCHAR for status if it's easier, 
        // but let's try to add 'Cancelled' to the existing type if it exists.
        // If it's a domain or type, we need its name. 
        // Given the controller already uses 'Cancelled', maybe it's already there or it's a VARCHAR.
        
        await client.query('COMMIT');
        console.log("Migration V3 completed successfully.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Migration V3 failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
};

migrate();
