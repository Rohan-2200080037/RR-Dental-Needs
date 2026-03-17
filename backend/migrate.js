const pool = require('./db');
require('dotenv').config();

pool.query('ALTER TABLE Addresses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;')
    .then(() => {
        console.log("SUCCESS_MIGRATION");
        process.exit(0);
    })
    .catch(err => {
        console.error("FAILURE_MIGRATION", err.message);
        process.exit(1);
    });
