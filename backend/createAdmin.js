require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("Admin@145858", 10);

  await pool.query(
    "INSERT INTO Users (name, email, password, role) VALUES ($1,$2,$3,$4)",
    ["Admin", "rrdentalneeds@gmail.com", hashedPassword, "admin"]
  );

  console.log("Admin created successfully");
  process.exit();
}

createAdmin();