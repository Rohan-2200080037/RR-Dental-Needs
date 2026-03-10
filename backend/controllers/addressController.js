const pool = require('../db');

exports.createAddress = async (req, res) => {
    const userId = req.user.id;
    const { name, phone, address, city, state, pincode } = req.body;

    if (!name || !phone || !address || !city || !state || !pincode) {
        return res.status(400).json({ message: "All address fields are required." });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO Addresses (user_id, name, phone, address, city, state, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, name, phone, address, city, state, pincode]
        );
        res.status(201).json({ id: result.insertId, message: "Address added successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAddresses = async (req, res) => {
    const userId = req.user.id;
    try {
        const [addresses] = await pool.query('SELECT * FROM Addresses WHERE user_id = ?', [userId]);
        res.status(200).json(addresses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateAddress = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, phone, address, city, state, pincode } = req.body;

    try {
        const [existing] = await pool.query('SELECT user_id FROM Addresses WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: "Address not found." });
        if (existing[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });

        await pool.query(
            'UPDATE Addresses SET name=?, phone=?, address=?, city=?, state=?, pincode=? WHERE id=?',
            [name, phone, address, city, state, pincode, id]
        );
        res.status(200).json({ message: "Address updated successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteAddress = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const [existing] = await pool.query('SELECT user_id FROM Addresses WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: "Address not found." });
        if (existing[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });

        await pool.query('DELETE FROM Addresses WHERE id = ?', [id]);
        res.status(200).json({ message: "Address deleted successfully." });
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};
