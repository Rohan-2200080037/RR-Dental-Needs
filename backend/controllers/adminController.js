const pool = require('../db');

exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM Users');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Users WHERE id = $1', [id]);
        res.status(200).json({ message: "User deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSellers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.id as seller_id, s.approved_status, u.id as user_id, u.name, u.email 
            FROM Sellers s
            JOIN Users u ON s.user_id = u.id
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateSellerStatus = async (req, res) => {
    const { id } = req.params; // Seller ID
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected', 'pending'].includes(status)) {
         return res.status(400).json({ message: "Invalid status." });
    }

    try {
        await pool.query('UPDATE Sellers SET approved_status = $1 WHERE id = $2', [status, id]);
        res.status(200).json({ message: `Seller status updated to ${status}.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const totalUsersResult = await pool.query("SELECT COUNT(*) as totalUsers FROM Users WHERE role = 'user'");
        const totalUsers = parseInt(totalUsersResult.rows[0].totalusers);
        
        const totalSellersResult = await pool.query("SELECT COUNT(*) as totalSellers FROM Users WHERE role = 'seller'");
        const totalSellers = parseInt(totalSellersResult.rows[0].totalsellers);
        
        const totalOrdersResult = await pool.query("SELECT COUNT(*) as totalOrders FROM Orders");
        const totalOrders = parseInt(totalOrdersResult.rows[0].totalorders);
        
        const totalRevenueResult = await pool.query("SELECT SUM(total_price) as totalRevenue FROM Orders WHERE order_status != 'Pending'");
        const totalRevenue = totalRevenueResult.rows[0].totalrevenue || 0;
        
        res.status(200).json({
            totalUsers,
            totalSellers,
            totalOrders,
            totalRevenue
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
