require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createCustomUsers = async () => {
  try {
    console.log("Connecting to Postgres to create custom users...");

    // 1. Create Seller
    const sellerEmail = 'chigurupatisrija2003@gmail.com';
    const sellerPass = 'Blacky@1458';
    const hashedSellerPass = bcrypt.hashSync(sellerPass, 8);

    console.log(`Creating Seller: ${sellerEmail}`);
    const sellerUserRes = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['Srija', sellerEmail, hashedSellerPass, 'seller']
    );

    if (sellerUserRes.rows.length > 0) {
      const sellerUserId = sellerUserRes.rows[0].id;
      await pool.query(
        `INSERT INTO sellers (user_id, store_name, approved_status)
         VALUES ($1, $2, $3)`,
        [sellerUserId, 'Srija Dental Store', 'approved']
      );
      console.log('Seller created and approved successfully.');
    } else {
      console.log('Seller email already exists.');
    }

    // 2. Create Admin
    const adminEmail = 'rrdentalneeds@gmail.com';
    const adminPass = 'Admin@145858';
    const hashedAdminPass = bcrypt.hashSync(adminPass, 8);

    console.log(`Creating Admin: ${adminEmail}`);
    const adminUserRes = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      ['RR Dental Admin', adminEmail, hashedAdminPass, 'admin']
    );

    if (adminUserRes.rows.length > 0) {
      console.log('Admin created successfully.');
    } else {
      console.log('Admin email already exists.');
    }

    console.log("All custom users processed.");
  } catch (err) {
    console.error("Error creating users:", err);
  } finally {
    pool.end();
  }
};

createCustomUsers();
