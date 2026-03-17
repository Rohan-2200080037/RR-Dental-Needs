const pool = require('../db');

exports.createProduct = async (req, res) => {
    const { name, description, price, stock_quantity, category } = req.body;
    let image = req.body.image;
    if (req.file) {
        image = req.file.path; // Cloudinary returns the full URL in .path
    }

    // Auth middleware attaches req.user (which contains sellerId if they are an approved seller)
    if (req.user.role !== 'seller') {
        return res.status(403).json({ message: "Only sellers can create products." });
    }

    if (!req.user.sellerId) {
        return res.status(403).json({ message: "Seller profile not found or pending approval." });
    }

    if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "Required fields are missing." });
    }

    try {
        const result = await pool.query(
            'INSERT INTO Products (name, description, price, image, stock_quantity, category, seller_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [name, description, price, image, stock_quantity || 0, category, req.user.sellerId]
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

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category } = req.body;
    
    let image = req.body.image;
    if (req.file) {
        image = req.file.path; // Cloudinary returns the full URL in .path
    }
    
    try {
        const result = await pool.query('SELECT seller_id FROM Products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (req.user.role === 'seller' && result.rows[0].seller_id !== req.user.sellerId) {
            return res.status(403).json({ message: "Unauthorized to update this product." });
        }

        let query = 'UPDATE Products SET name=$1, description=$2, price=$3, stock_quantity=$4, category=$5 WHERE id=$6';
        let queryParams = [name, description, price, stock_quantity, category, id];

        if (image) {
             query = 'UPDATE Products SET name=$1, description=$2, price=$3, image=$4, stock_quantity=$5, category=$6 WHERE id=$7';
             queryParams = [name, description, price, image, stock_quantity, category, id];
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
        const productResult = await pool.query('SELECT category FROM Products WHERE id = $1', [id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        const category = productResult.rows[0].category;
        const result = await pool.query('SELECT * FROM Products WHERE category = $1 AND id != $2 LIMIT 4', [category, id]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.searchProducts = async (req, res) => {
    const { q, minPrice, maxPrice, category } = req.query;
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
