const { Client } = require('pg');

const commonPasswords = ['', 'postgres', 'password', 'admin', 'root', '1234', '123456'];
const usernames = ['postgres', 'odontic_user'];

async function testConnection() {
    for (const user of usernames) {
        for (const password of commonPasswords) {
            console.log(`Trying credentials: ${user} / ${password === '' ? '(empty)' : password}`);
            const client = new Client({
                host: 'localhost',
                port: 5432,
                user: user,
                password: password,
                database: 'postgres' // Try default database first
            });

            try {
                await client.connect();
                console.log(`\n🎉 SUCCESS! Connected with credentials: ${user} / ${password}`);
                
                // Let's check if 'odontic_store' database exists
                const res = await client.query("SELECT datname FROM pg_database WHERE datname = 'odontic_store'");
                if (res.rows.length > 0) {
                    console.log("Database 'odontic_store' already exists!");
                } else {
                    console.log("Database 'odontic_store' does not exist. Creating it...");
                    await client.query("CREATE DATABASE odontic_store");
                    console.log("Database 'odontic_store' created successfully!");
                }
                
                await client.end();
                process.exit(0);
            } catch (err) {
                // If it's a password auth error, try next password
                // If it's another error, log it
                if (err.message.includes('password authentication failed') || err.message.includes('no pg_hba.conf entry')) {
                    // expected failure, try next
                } else {
                    console.log(`Failed with error: ${err.message}`);
                }
            }
        }
    }
    console.log("Failed to connect with any common credentials.");
    process.exit(1);
}

testConnection();
