require('dotenv').config();
const pool = require('./db');
const { cloudinary } = require('./config/cloudinary');
const fs = require('fs');
const path = require('path');

const DEPLOYED_BACKEND_URL = 'https://odontic-backend.onrender.com';

async function uploadToCloudinary(filePathOrUrl) {
    try {
        const result = await cloudinary.uploader.upload(filePathOrUrl, {
            folder: 'odontic_store',
        });
        return result.secure_url;
    } catch (error) {
        console.error(`Cloudinary upload failed for ${filePathOrUrl}:`, error.message);
        return null;
    }
}

async function migrate() {
    console.log("Starting image migration to Cloudinary...");
    try {
        // Query all products that have local uploads path
        const res = await pool.query("SELECT id, name, image FROM Products WHERE image LIKE '/uploads/%'");
        const products = res.rows;
        
        console.log(`Found ${products.length} products with local image paths.`);
        
        let successful = 0;
        let failed = 0;
        let skipped = 0;

        for (const product of products) {
            console.log(`\nProcessing Product ID ${product.id}: "${product.name}"`);
            const localImageRelativePath = product.image; // e.g. /uploads/image-123.jpg
            
            // 1. Check local file system
            const localPath = path.join(__dirname, localImageRelativePath);
            let sourcePath = null;
            let tempFileCreated = false;
            let tempFilePath = null;

            if (fs.existsSync(localPath)) {
                console.log(`Found image locally at: ${localPath}`);
                sourcePath = localPath;
            } else {
                // 2. Check remote server
                const remoteUrl = `${DEPLOYED_BACKEND_URL}${localImageRelativePath}`;
                console.log(`Image not found locally. Checking remote: ${remoteUrl}`);
                try {
                    const response = await fetch(remoteUrl);
                    if (response.ok) {
                        console.log(`Image found remotely. Downloading...`);
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        
                        // Create a temporary file to upload to Cloudinary
                        tempFilePath = path.join(__dirname, 'temp_migrate_image' + path.extname(localImageRelativePath));
                        fs.writeFileSync(tempFilePath, buffer);
                        sourcePath = tempFilePath;
                        tempFileCreated = true;
                        console.log(`Downloaded to temporary file: ${tempFilePath}`);
                    } else {
                        console.log(`Image not found remotely (HTTP Status: ${response.status})`);
                    }
                } catch (fetchErr) {
                    console.error(`Failed to fetch remote image: ${fetchErr.message}`);
                }
            }

            if (sourcePath) {
                console.log(`Uploading to Cloudinary...`);
                const cloudinaryUrl = await uploadToCloudinary(sourcePath);
                
                if (cloudinaryUrl) {
                    console.log(`Success! Cloudinary URL: ${cloudinaryUrl}`);
                    
                    // Update database
                    await pool.query("UPDATE Products SET image = $1 WHERE id = $2", [cloudinaryUrl, product.id]);
                    console.log(`Database updated for Product ID ${product.id}.`);
                    successful++;
                } else {
                    console.error(`Failed to upload to Cloudinary.`);
                    failed++;
                }

                // Cleanup temp file if created
                if (tempFileCreated && tempFilePath && fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                    console.log(`Cleaned up temp file.`);
                }
            } else {
                console.log(`Skipping migration for product "${product.name}" as image file is not accessible.`);
                skipped++;
            }
        }

        console.log(`\nMigration completed!`);
        console.log(`Successful migrations: ${successful}`);
        console.log(`Failed migrations: ${failed}`);
        console.log(`Skipped migrations (not found): ${skipped}`);

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        pool.end();
    }
}

migrate();
