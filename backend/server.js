require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./services/loggingService');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const addressRoutes = require('./routes/addressRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const shippingRoutes = require('./routes/shippingRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'https://rrdentalneeds.vercel.app',
    'https://rrdentalneeds.online',
    'https://www.rrdentalneeds.online'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1',
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Fallback for missing upload files - redirect to production server
// IMPORTANT: Only redirect if we are NOT already on the production server.
// If we are on the production host and the file is missing, return 404 directly
// to prevent an infinite redirect loop (production → production → ...).
app.use('/uploads', (req, res, next) => {
  if (req.method === 'GET') {
    const productionBackendUrl = process.env.PRODUCTION_BACKEND_URL || 'https://odontic-backend.onrender.com';
    const productionHost = new URL(productionBackendUrl).hostname; // e.g. 'odontic-backend.onrender.com'
    const requestHost = (req.headers.host || '').split(':')[0]; // strip port if present

    // If we are already on the production server, the file is genuinely missing — return 404
    if (requestHost === productionHost) {
      return next();
    }

    // Otherwise (local dev, staging, etc.) redirect to the production copy
    const deployedUrl = `${productionBackendUrl}/uploads${req.url}`;
    return res.redirect(deployedUrl);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/shipping', shippingRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Odontic Store API' });
});

app.use(notFound);
app.use(errorHandler);

// Auto-run schema migrations on startup
const pool = require('./db');
async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE Addresses 
      ADD COLUMN IF NOT EXISTS is_saved BOOLEAN DEFAULT TRUE;
    `);
    console.log('Schema migration: is_saved column ensured on Addresses table.');

    await pool.query(`
      ALTER TABLE Users 
      ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_password_expire TIMESTAMP;
    `);
    console.log('Schema migration: reset_password_token and reset_password_expire columns ensured on Users table.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh VARCHAR(255) NOT NULL,
          auth VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Schema migration: push_subscriptions table ensured.');

    // ── Shipping & Order Status Migrations ──
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS shipping_charge DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50) DEFAULT 'Pending',
      ADD COLUMN IF NOT EXISTS courier_name VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS shipment_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS shipping_provider VARCHAR(50) DEFAULT '';
    `);
    console.log('Schema migration: shipping columns ensured on orders table.');

    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_cod_blocked BOOLEAN DEFAULT FALSE;
    `);
    console.log('Schema migration: is_cod_blocked column ensured on users table.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS logistics_settings (
        id SERIAL PRIMARY KEY,
        max_cod_amount DECIMAL(10, 2) DEFAULT 10000.00,
        cod_enabled BOOLEAN DEFAULT TRUE,
        blocked_pincodes TEXT DEFAULT '',
        high_value_threshold DECIMAL(10, 2) DEFAULT 5000.00,
        otp_verification_enabled BOOLEAN DEFAULT TRUE
      );
    `);
    const settingsCheck = await pool.query('SELECT * FROM logistics_settings LIMIT 1');
    if (settingsCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO logistics_settings (max_cod_amount, cod_enabled, blocked_pincodes, high_value_threshold, otp_verification_enabled)
        VALUES (10000.00, TRUE, '', 5000.00, TRUE);
      `);
    }
    console.log('Schema migration: logistics_settings table ensured.');

    await pool.query(`
      ALTER TABLE Addresses
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) DEFAULT NULL;
    `);
    console.log('Schema migration: lat/lng columns ensured on Addresses table.');

    await pool.query(`
      ALTER TABLE Orders
      ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 7) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(10, 7) DEFAULT NULL;
    `);
    console.log('Schema migration: lat/lng columns ensured on Orders table.');

    await pool.query(`
      ALTER TABLE Orders
      ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE DEFAULT NULL;
    `);
    console.log('Schema migration: estimated_delivery_date column ensured on Orders table.');
  } catch (err) {
    console.error('Schema migration error:', err.message);
  }
}

runMigrations().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
