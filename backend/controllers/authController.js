const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;
    
    // Default role must always be user
    const assignedRole = 'user';

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    try {
        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            return res.status(400).json({ message: "Email already exists!" });
        }

        const hashedPassword = bcrypt.hashSync(password, 8);
        
        const insertResult = await pool.query(
            'INSERT INTO Users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, email, hashedPassword, assignedRole]
        );
        
        const newUserId = insertResult.rows[0].id;

        if (assignedRole === 'seller') {
            await pool.query('INSERT INTO Sellers (user_id, approved_status) VALUES ($1, $2)', [newUserId, 'pending']);
        }

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Please provide email and password" });
    }

    try {
        const usersResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        const users = usersResult.rows;
        
        if (users.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const user = users[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).json({ accessToken: null, message: "Invalid Password!" });
        }

        let sellerId = null;
        let approvedStatus = null;
        
        if (user.role === 'seller') {
             const sellersResult = await pool.query('SELECT id, approved_status FROM Sellers WHERE user_id = $1', [user.id]);
             const sellers = sellersResult.rows;
             if (sellers.length > 0) {
                 sellerId = sellers[0].id;
                 approvedStatus = sellers[0].approved_status;
                 if (approvedStatus !== 'approved') {
                     return res.status(403).json({ message: "Seller account pending approval or rejected." });
                 }
             }
        }

        const token = jwt.sign({ id: user.id, role: user.role, sellerId: sellerId }, process.env.JWT_SECRET || 'fallback_secret', {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            sellerId: sellerId,
            accessToken: token
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    try {
        const usersResult = await pool.query('SELECT id, email FROM Users WHERE email = $1', [email]);
        if (usersResult.rows.length === 0) {
            // Return success even if not found to prevent email enumeration
            return res.status(200).json({ message: "If this email is registered, a reset link has been sent." });
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Hash token before storing
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            'UPDATE Users SET reset_password_token = $1, reset_password_expire = $2 WHERE email = $3',
            [hashedToken, expiry, email]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.SMTP_EMAIL || 'no-reply@odonticstore.com',
            to: email,
            subject: 'Password Reset Request',
            html: `
                <p>Click the link below to reset your password.</p>
                <p>The link expires in 1 hour.</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message: "If this email is registered, a reset link has been sent." });
        } catch (mailError) {
            console.error("Could not send email:", mailError);
            
            // Revert changes in DB if email fails
            await pool.query(
                'UPDATE Users SET reset_password_token = NULL, reset_password_expire = NULL WHERE email = $1',
                [email]
            );
            return res.status(500).json({ message: "Email could not be sent. Please try again later." });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    
    // In our routes, we mapped /reset-password, but wait, authRoutes says router.post('/reset-password', authController.resetPassword);
    // Let me check if authRoutes maps this to /reset-password/:token. The user asked for "POST /api/auth/reset-password/:token"
    
    const requestToken = req.params.token || req.body.token;

    if (!requestToken || !password) return res.status(400).json({ message: "Token and new password are required." });

    try {
        const hashedToken = crypto.createHash('sha256').update(requestToken).digest('hex');

        const usersResult = await pool.query(
            'SELECT id FROM Users WHERE reset_password_token = $1 AND reset_password_expire > NOW()',
            [hashedToken]
        );

        if (usersResult.rows.length === 0) {
            return res.status(400).json({ message: "Reset token is invalid or has expired" });
        }

        const user = usersResult.rows[0];
        const hashedPassword = bcrypt.hashSync(password, 8);
        
        await pool.query(
            'UPDATE Users SET password = $1, reset_password_token = NULL, reset_password_expire = NULL WHERE id = $2', 
            [hashedPassword, user.id]
        );
        
        res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM Users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { name, email } = req.body;
    try {
        if (email) {
            const result = await pool.query('SELECT * FROM Users WHERE email = $1 AND id != $2', [email, req.user.id]);
            if (result.rows.length > 0) {
                return res.status(400).json({ message: "Email already in use by another account." });
            }
        }
        
        await pool.query(
            'UPDATE Users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3',
            [name, email, req.user.id]
        );
        res.status(200).json({ message: "Profile updated successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        await pool.query('DELETE FROM Users WHERE id = $1', [req.user.id]);
        res.status(200).json({ message: "Account deleted successfully." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, created_at FROM Users ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteUserAsAdmin = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Users WHERE id = $1', [id]);
        res.status(200).json({ message: "User deleted by admin." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
