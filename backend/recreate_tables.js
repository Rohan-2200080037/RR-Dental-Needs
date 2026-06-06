require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const recreateTables = async () => {
  try {
    console.log("Connecting to Postgres...");

    // Create ENUM equivalents using CHECK constraints for better Postgres compatibility if ENUMs don't exist
    
    // Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created users table");

    // Sellers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sellers (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          store_name VARCHAR(100),
          approved_status VARCHAR(50) DEFAULT 'pending' CHECK (approved_status IN ('pending', 'approved', 'rejected')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log("Created sellers table");

    // Products
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          image VARCHAR(255),
          stock_quantity INT NOT NULL DEFAULT 0,
          year VARCHAR(100) NOT NULL,
          category VARCHAR(100) NOT NULL,
          seller_id INT NOT NULL,
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      );
    `);
    console.log("Created products table");

    // Cart
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    console.log("Created cart table");

    // Addresses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(100) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          address TEXT NOT NULL,
          city VARCHAR(50) NOT NULL,
          state VARCHAR(50) NOT NULL,
          pincode VARCHAR(20) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log("Created addresses table");

    // Orders
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          address_id INT NOT NULL,
          order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_price DECIMAL(10, 2) NOT NULL,
          order_status VARCHAR(50) DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Packed', 'Shipped', 'Delivered')),
          payment_method VARCHAR(50) DEFAULT 'COD',
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (address_id) REFERENCES addresses(id)
      );
    `);
    console.log("Created orders table");

    // Order_Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
    console.log("Created order_items table");

    // Wishlist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
          UNIQUE (user_id, product_id)
      );
    `);
    console.log("Created wishlist table");

    // Reviews
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    console.log("Created reviews table");

    // Contact Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created contact_messages table");

    console.log("All tables created successfully!");

  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    pool.end();
  }
};

recreateTables();
