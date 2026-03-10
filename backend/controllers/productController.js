const pool = require('../db');

exports.createProduct = async (req, res) => {
    const { name, description, price, stock_quantity, category } = req.body;
    let image = req.body.image;
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
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
        const [result] = await pool.query(
            'INSERT INTO Products (name, description, price, image, stock_quantity, category, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, price, image, stock_quantity || 0, category, req.user.sellerId]
        );
        res.status(201).json({ id: result.insertId, message: "Product created successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const [products] = await pool.query('SELECT * FROM Products');
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const [products] = await pool.query('SELECT * FROM Products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.status(200).json(products[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProductsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        const decodedCategory = decodeURIComponent(category);
        const [products] = await pool.query('SELECT * FROM Products WHERE category = ?', [decodedCategory]);
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category } = req.body;
    
    let image = req.body.image;
    if (req.file) {
        image = `/uploads/${req.file.filename}`;
    }
    
    try {
        const [products] = await pool.query('SELECT seller_id FROM Products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (req.user.role === 'seller' && products[0].seller_id !== req.user.sellerId) {
            return res.status(403).json({ message: "Unauthorized to update this product." });
        }

        let query = 'UPDATE Products SET name=?, description=?, price=?, stock_quantity=?, category=? WHERE id=?';
        let queryParams = [name, description, price, stock_quantity, category, id];

        if (image) {
             query = 'UPDATE Products SET name=?, description=?, price=?, image=?, stock_quantity=?, category=? WHERE id=?';
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
        const [products] = await pool.query('SELECT seller_id FROM Products WHERE id = ?', [id]);
        if (products.length === 0) {
            return res.status(404).json({ message: "Product not found." });
        }

        if (req.user.role === 'seller' && products[0].seller_id !== req.user.sellerId) {
             if (req.user.role !== 'admin') {
                return res.status(403).json({ message: "Unauthorized to delete this product." });
             }
        }

        await pool.query('DELETE FROM Products WHERE id = ?', [id]);
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
        const [products] = await pool.query('SELECT * FROM Products WHERE seller_id = ?', [req.user.sellerId]);
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
