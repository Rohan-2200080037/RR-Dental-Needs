const pool = require('../db');

exports.createAddress = async (req, res) => {
    const userId = req.user.id;
    const { name, phone, address, city, state, pincode } = req.body;

    if (!name || !phone || !address || !city || !state || !pincode) {
        return res.status(400).json({ message: "All address fields are required." });
    }

    try {
        // Check if an identical address already exists for this user
        const existing = await pool.query(
            'SELECT id, is_active FROM Addresses WHERE user_id = $1 AND name = $2 AND phone = $3 AND address = $4 AND city = $5 AND state = $6 AND pincode = $7',
            [userId, name, phone, address, city, state, pincode]
        );

        if (existing.rows.length > 0) {
            const addrId = existing.rows[0].id;
            // If it exists but was soft-deleted, reactivate it
            if (existing.rows[0].is_active === false) {
                await pool.query('UPDATE Addresses SET is_active = TRUE WHERE id = $1', [addrId]);
            }
            return res.status(200).json({ id: addrId, message: "Address already exists." });
        }

        const result = await pool.query(
            'INSERT INTO Addresses (user_id, name, phone, address, city, state, pincode) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
            [userId, name, phone, address, city, state, pincode]
        );
        res.status(201).json({ id: result.rows[0].id, message: "Address added successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAddresses = async (req, res) => {
    const userId = req.user.id;
    try {
        const result = await pool.query('SELECT * FROM Addresses WHERE user_id = $1 AND (is_active = TRUE OR is_active IS NULL)', [userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateAddress = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, phone, address, city, state, pincode } = req.body;

    try {
        const result = await pool.query('SELECT user_id FROM Addresses WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Address not found." });
        if (result.rows[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });

        await pool.query(
            'UPDATE Addresses SET name=$1, phone=$2, address=$3, city=$4, state=$5, pincode=$6 WHERE id=$7',
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
        const result = await pool.query('SELECT user_id FROM Addresses WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Address not found." });
        if (result.rows[0].user_id !== userId) return res.status(403).json({ message: "Unauthorized." });

        // Soft delete: set is_active to FALSE
        // This allows us to keep the address for order history while hiding it from the user's focus
        await pool.query('UPDATE Addresses SET is_active = FALSE WHERE id = $1', [id]);
        res.status(200).json({ message: "Address deleted successfully." });
    } catch (err) {
         res.status(500).json({ message: err.message });
    }
};
