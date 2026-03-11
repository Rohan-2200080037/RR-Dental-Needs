require('dotenv').config();
const pool = require('./db.js');

async function alterDB() {
  try {
    await pool.query('ALTER TABLE Users ADD COLUMN IF NOT EXISTS reset_password_token TEXT, ADD COLUMN IF NOT EXISTS reset_password_expire TIMESTAMP');
    console.log("Database altered successfully with new column names");
  } catch(e) {
    console.error("DB Alter error:", e);
  } finally {
    process.exit();
  }
}

alterDB();
