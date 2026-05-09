const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle pg client', err);
});

pool.connect()
  .then(() => console.log("PostgreSQL connected"))
  .catch(err => console.error("Database connection error:", err));

module.exports = pool;