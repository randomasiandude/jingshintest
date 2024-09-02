const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2');
const session = require('express-session');

const app = express();
const PORT = 5001;

// Middleware
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://192.168.50.59:3000', // Replace with your frontend's origin
    credentials: true
}));
// Setup session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Create a MySQL connection
const db = mysql.createConnection({
    host: '192.168.50.133',
    user: 'alice', // replace with your MySQL username
    password: 'alice123', // replace with your MySQL password
    database: 'work_orders_db'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Register endpoint
app.post('/register', (req, res) => {
    const { username, password, floor, name } = req.body;

    // Check if user already exists
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length > 0) return res.status(400).json({ message: 'User already exists' });

        // Generate a unique user_id
        const userId = uuidv4();

        // Hash the password
        const hashedPassword = bcrypt.hashSync(password, 8);

        // Insert the new user into the database with the floor and name
        const query = 'INSERT INTO users (user_id, username, password, role, is_approved, floor, name) VALUES (?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [userId, username, hashedPassword, 'user', false, floor, name], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            res.status(201).json({ message: 'Registration successful. Awaiting approval.', userId: userId });
        });
    });
});

// Login endpoint with session handling
app.post('/login', (req, res) => {
    const { identifier, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? OR user_id = ?';
    db.query(query, [identifier, identifier], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(400).json({ message: 'User not found' });

        const user = results[0];

        if (!user.is_approved) {
            return res.status(403).json({ message: 'Account not approved. Please wait for admin approval.' });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Store user info in the session
        req.session.user = {
            id: user.id,
            role: user.role
        };

        res.status(200).json({ message: 'Login successful' });
    });
});


// Route to check if the user is an admin or user
app.get('/check-auth', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ role: req.session.user.role });
    } else {
        res.status(403).json({ message: 'Access denied' });
    }
});

// Approve user endpoint (only accessible by admins)
app.post('/approve-user', (req, res) => {
    const { user_id } = req.body;

    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const query = 'UPDATE users SET is_approved = TRUE WHERE user_id = ?';
    db.query(query, [user_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ message: 'User approved successfully' });
    });
});

// Fetch all pending registrations (only accessible by admins)
app.get('/pending-registrations', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const query = 'SELECT user_id, username, name, role, floor, created_at FROM users WHERE is_approved = FALSE';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(200).json(results);
    });
});

// Logout endpoint to destroy the session
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
