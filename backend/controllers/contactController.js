const pool = require('../db');

exports.submitContactMessage = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Name, email, and message are required" });
        }

        const query = `
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `;
        
        await pool.query(query, [name, email, subject, message]);
        
        res.status(201).json({ message: "Message submitted successfully" });
    } catch (error) {
        console.error("Error submitting contact message:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.getContactMessages = async (req, res) => {
    try {
        const query = `
            SELECT id, name, email, subject, message, created_at 
            FROM contact_messages 
            ORDER BY created_at DESC
        `;
        const { rows } = await pool.query(query);
        
        res.json(rows);
    } catch (error) {
        console.error("Error fetching contact messages:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
