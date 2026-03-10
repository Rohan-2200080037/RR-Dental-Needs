require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'odontic_store',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log("Connected to Database. Creating tables...");
        // Ensure schema exists first
        const fs = require('fs');
        const path = require('path');
        const schema = fs.readFileSync(path.join(__dirname, '../schema.sql')).toString();
        const queries = schema.split(';').filter(q => q.trim());
        
        // This is safe to uncomment if db is empty or root drop isn't blocked, 
        // but let's assume the DB schema is already executed via command line and we just seed data
        console.log("Seeding base users...");
        
        // Users
        const adminPass = bcrypt.hashSync('admin123', 8);
        const sellerPass = bcrypt.hashSync('seller123', 8);
        const userPass = bcrypt.hashSync('user123', 8);

        // check if empty
        const [existing] = await pool.query('SELECT count(*) as c FROM Users');
        if (existing[0].c > 0) {
            console.log("Database already has users. Skipping seed.");
            process.exit(0);
        }

        const [adminRes] = await pool.query("INSERT INTO Users (name, email, password, role) VALUES ('System Admin', 'admin@odontic.com', ?, 'admin')", [adminPass]);
        
        const [seller1Res] = await pool.query("INSERT INTO Users (name, email, password, role) VALUES ('Dental Tools Inc', 'seller@odontic.com', ?, 'seller')", [sellerPass]);
        const seller1UserId = seller1Res.insertId;
        await pool.query("INSERT INTO Sellers (user_id, store_name, approved_status) VALUES (?, 'Dental Tools Inc', 'approved')", [seller1UserId]);
        const [[{ id: s1Id }]] = await pool.query("SELECT id FROM Sellers WHERE user_id = ?", [seller1UserId]);

        const [userRes] = await pool.query("INSERT INTO Users (name, email, password, role) VALUES ('John Student', 'user@odontic.com', ?, 'user')", [userPass]);

        console.log("Seeding products...");
        const products = [
            // 1st Year
            { name: 'Roberts Retractor', desc: 'Used for retraction in orthodotics models.', price: 150.00, stock: 50, cat: '1st Year', img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=60' },
            { name: 'Triangular Clasp', desc: 'Standard clasp for partial dentures and appliances.', price: 45.00, stock: 100, cat: '1st Year', img: 'https://images.unsplash.com/photo-1598256989467-f584fbbc9277?w=500&auto=format&fit=crop&q=60' },
            { name: 'Z Spring', desc: 'Orthodontic spring for lab exercises.', price: 20.00, stock: 200, cat: '1st Year', img: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=60' },
            
            // 2nd Year
            { name: 'Adams Clasp', desc: 'Robust retention clasp used widely in removable appliances.', price: 55.00, stock: 150, cat: '2nd Year', img: 'https://images.unsplash.com/photo-1536841280383-746a50302ad9?w=500&auto=format&fit=crop&q=60' },
            { name: 'Short Labial Bow', desc: 'Labial bow used for anterior retraction and retention.', price: 85.00, stock: 80, cat: '2nd Year', img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60' },
            { name: 'Long Labial Bow', desc: 'Extended labial bow reaching to the premolars.', price: 90.00, stock: 75, cat: '2nd Year', img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=60' },

            // 3rd Year
            { name: 'Split Labial Bow', desc: 'Modified labial bow for individual tooth control.', price: 110.00, stock: 60, cat: '3rd Year', img: 'https://images.unsplash.com/photo-1598256989467-f584fbbc9277?w=500&auto=format&fit=crop&q=60' },
            { name: 'Modified Split Labial Bow', desc: 'Advanced split design for complex movements.', price: 125.00, stock: 40, cat: '3rd Year', img: 'https://images.unsplash.com/photo-1536841280383-746a50302ad9?w=500&auto=format&fit=crop&q=60' },
            { name: 'Coffin Spring', desc: 'Omega shaped spring used for palatal expansion.', price: 175.00, stock: 35, cat: '3rd Year', img: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=60' },

            // 4th Year
            { name: 'Buccal Canine Retractor', desc: 'Used for individual canine retraction in extraction cases.', price: 140.00, stock: 45, cat: '4th Year', img: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60' },
            { name: 'Helical Canine Retractor', desc: 'Offers lighter, continuous force for canine retraction.', price: 160.00, stock: 30, cat: '4th Year', img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=60' }
        ];

        for (let p of products) {
            await pool.query(
                "INSERT INTO Products (name, description, price, stock_quantity, category, image, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [p.name, p.desc, p.price, p.stock, p.cat, p.img, s1Id]
            );
        }

        console.log("Database seeded successfully!");
        process.exit(0);

    } catch (err) {
        console.error("Error seeding database:", err);
        process.exit(1);
    }
};

seedDatabase();
