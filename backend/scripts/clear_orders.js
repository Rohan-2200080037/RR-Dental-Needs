const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const delNotif = await client.query("DELETE FROM notifications WHERE message LIKE 'Order #%'");
    console.log(`Deleted ${delNotif.rowCount} notifications`);
    const delItems = await client.query('DELETE FROM order_items');
    console.log(`Deleted ${delItems.rowCount} order items`);
    const delOrders = await client.query('DELETE FROM orders');
    console.log(`Deleted ${delOrders.rowCount} orders`);
    await client.query('ALTER SEQUENCE orders_id_seq RESTART WITH 1');
    console.log('Order ID sequence reset to 1');
    await client.query('COMMIT');
    console.log('SUCCESS: All orders cleared and sequence reset.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
})();
