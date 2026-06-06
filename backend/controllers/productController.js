const pool = require('../db');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                               process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
                               process.env.CLOUDINARY_API_KEY && 
                               process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
                               process.env.CLOUDINARY_API_SECRET && 
                               process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

const handleImageUpload = async (file) => {
    if (!file) return null;
    if (isCloudinaryConfigured) {
        try {
            const uploadResult = await cloudinary.uploader.upload(file.path, {
                folder: 'odontic_store'
            });
            // Delete local file after successful upload to Cloudinary
            fs.unlink(file.path, (err) => {
                if (err) console.error("Error deleting local temp file:", err);
            });
            return uploadResult.secure_url;
        } catch (err) {
            console.error("Cloudinary upload failed, falling back to local file path:", err);
            return `/uploads/${file.filename}`;
        }
    } else {
        return `/uploads/${file.filename}`;
    }
};

exports.createProduct = async (req, res) => {
    const { name, description, price, stock_quantity, year, category } = req.body;
    let image = req.body.image;
    if (req.file) {
        image = await handleImageUpload(req.file);
    }

    // Auth middleware attaches req.user (which contains sellerId if they are an approved seller)
    if (req.user.role !== 'seller') {
        return res.status(403).json({ message: "Only sellers can create products." });
    }

    if (!req.user.sellerId) {
        return res.status(403).json({ message: "Seller profile not found or pending approval." });
    }

    if (!name || !description || !price || !year || !category) {
        return res.status(400).json({ message: "Required fields are missing." });
    }

    try {
        const result = await pool.query(
            'INSERT INTO Products (name, description, price, image, stock_quantity, year, category, seller_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [name, description, price, image, stock_quantity || 0, year, category, req.user.sellerId]
        );
        res.status(201).json({ id: result.rows[0].id, message: "Product created successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Products');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const decodedCategory = decodeURIComponent(category);
        const result = await pool.query('SELECT * FROM Products WHERE category = $1', [decodedCategory]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductsByYear = async (req, res) => {
    const { year } = req.params;
    try {
        const decodedYear = decodeURIComponent(year);
        const result = await pool.query('SELECT * FROM Products WHERE year = $1', [decodedYear]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock_quantity, year, category } = req.body;
    
    let image = req.body.image;
    if (req.file) {
        image = await handleImageUpload(req.file);
    }
    
    try {
        const result = await pool.query('SELECT seller_id FROM Products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (req.user.role === 'seller' && result.rows[0].seller_id !== req.user.sellerId) {
            return res.status(403).json({ message: "Unauthorized to update this product." });
        }

        let query = 'UPDATE Products SET name=$1, description=$2, price=$3, stock_quantity=$4, year=$5, category=$6 WHERE id=$7';
        let queryParams = [name, description, price, stock_quantity, year, category, id];

        if (image) {
             query = 'UPDATE Products SET name=$1, description=$2, price=$3, image=$4, stock_quantity=$5, year=$6, category=$7 WHERE id=$8';
             queryParams = [name, description, price, image, stock_quantity, year, category, id];
        }

        await pool.query(query, queryParams);
        res.status(200).json({ message: "Product updated successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query('SELECT seller_id FROM Products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (req.user.role === 'seller' && result.rows[0].seller_id !== req.user.sellerId) {
             if (req.user.role !== 'admin') {
                return res.status(403).json({ message: "Unauthorized to delete this product." });
             }
        }

        await pool.query('DELETE FROM Products WHERE id = $1', [id]);
        res.status(200).json({ message: "Product deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSellerProducts = async (req, res) => {
    if (!req.user.sellerId) {
        return res.status(403).json({ message: "Seller profile not found or pending approval." });
    }
    
    try {
        const result = await pool.query('SELECT * FROM Products WHERE seller_id = $1', [req.user.sellerId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRecommendedProducts = async (req, res) => {
    const { id } = req.params;
    try {
        const productResult = await pool.query('SELECT category, year FROM Products WHERE id = $1', [id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        const { category, year } = productResult.rows[0];
        // Recommend products from same category or same year
        const result = await pool.query('SELECT * FROM Products WHERE (category = $1 OR year = $2) AND id != $3 LIMIT 4', [category, year, id]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.searchProducts = async (req, res) => {
    const { q, minPrice, maxPrice, category, year } = req.query;
    let query = 'SELECT * FROM Products WHERE 1=1';
    let queryParams = [];
    let paramCount = 1;

    if (q) {
        query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        queryParams.push(`%${q}%`);
        paramCount++;
    }

    if (minPrice) {
        query += ` AND price >= $${paramCount}`;
        queryParams.push(minPrice);
        paramCount++;
    }

    if (maxPrice) {
        query += ` AND price <= $${paramCount}`;
        queryParams.push(maxPrice);
        paramCount++;
    }

    if (category) {
        query += ` AND category = $${paramCount}`;
        queryParams.push(category);
        paramCount++;
    }

    if (year) {
        query += ` AND year = $${paramCount}`;
        queryParams.push(year);
        paramCount++;
    }

    try {
        const result = await pool.query(query, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getLowStockProducts = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Products WHERE stock_quantity <= low_stock_threshold');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
