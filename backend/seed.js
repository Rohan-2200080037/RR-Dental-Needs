require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const seedDatabase = async () => {
  try {
    console.log("Connected to PostgreSQL...");

    // check if users already exist
    const existing = await pool.query('SELECT COUNT(*) as c FROM users');
    if (existing.rows[0].c > 0) {
      console.log("Database already seeded. Skipping.");
      process.exit(0);
    }

    console.log("Seeding base users...");

    const adminPass = bcrypt.hashSync('admin123', 8);
    const sellerPass = bcrypt.hashSync('seller123', 8);
    const userPass = bcrypt.hashSync('user123', 8);

    // Admin
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1,$2,$3,$4)`,
      ['System Admin', 'admin@odontic.com', adminPass, 'admin']
    );

    // Seller
    const sellerUser = await pool.query(
      `INSERT INTO users (name,email,password,role)
       VALUES ($1,$2,$3,$4)
       RETURNING id`,
      ['Dental Tools Inc','seller@odontic.com',sellerPass,'seller']
    );

    const sellerUserId = sellerUser.rows[0].id;

    const seller = await pool.query(
      `INSERT INTO sellers (user_id, store_name, approved_status)
       VALUES ($1,$2,$3)
       RETURNING id`,
      [sellerUserId,'Dental Tools Inc','approved']
    );

    const sellerId = seller.rows[0].id;

    // Student user
    await pool.query(
      `INSERT INTO users (name,email,password,role)
       VALUES ($1,$2,$3,$4)`,
      ['John Student','user@odontic.com',userPass,'user']
    );

    console.log("Seeding products...");

    const products = [
      { name:'Roberts Retractor',desc:'Used for retraction in orthodontics models.',price:150,stock:50,cat:'1st Year',img:'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=60'},
      { name:'Triangular Clasp',desc:'Standard clasp for partial dentures.',price:45,stock:100,cat:'1st Year',img:'https://images.unsplash.com/photo-1598256989467-f584fbbc9277?w=500&auto=format&fit=crop&q=60'},
      { name:'Z Spring',desc:'Orthodontic spring for lab exercises.',price:20,stock:200,cat:'1st Year',img:'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=60'},

      { name:'Adams Clasp',desc:'Robust retention clasp.',price:55,stock:150,cat:'2nd Year',img:'https://images.unsplash.com/photo-1536841280383-746a50302ad9?w=500&auto=format&fit=crop&q=60'},
      { name:'Short Labial Bow',desc:'Labial bow for anterior retraction.',price:85,stock:80,cat:'2nd Year',img:'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60'},
      { name:'Long Labial Bow',desc:'Extended labial bow.',price:90,stock:75,cat:'2nd Year',img:'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=60'},

      { name:'Split Labial Bow',desc:'Modified labial bow.',price:110,stock:60,cat:'3rd Year',img:'https://images.unsplash.com/photo-1598256989467-f584fbbc9277?w=500&auto=format&fit=crop&q=60'},
      { name:'Modified Split Labial Bow',desc:'Advanced split design.',price:125,stock:40,cat:'3rd Year',img:'https://images.unsplash.com/photo-1536841280383-746a50302ad9?w=500&auto=format&fit=crop&q=60'},
      { name:'Coffin Spring',desc:'Palatal expansion spring.',price:175,stock:35,cat:'3rd Year',img:'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=60'},

      { name:'Buccal Canine Retractor',desc:'Canine retraction appliance.',price:140,stock:45,cat:'4th Year',img:'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=500&auto=format&fit=crop&q=60'},
      { name:'Helical Canine Retractor',desc:'Light continuous canine force.',price:160,stock:30,cat:'4th Year',img:'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=500&auto=format&fit=crop&q=60'}
    ];

    for (let p of products) {
      await pool.query(
        `INSERT INTO products
        (name,description,price,stock_quantity,category,image,seller_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [p.name,p.desc,p.price,p.stock,p.cat,p.img,sellerId]
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