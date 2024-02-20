const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');

const app = express();
const port = 5000;

// CORS middleware setup
app.use(cors({
  origin: 'http://localhost:8080', // This is where your front-end is hosted
  credentials: true
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Database connection pool setup
const dbHost = process.env.DB_HOST || 'localhost';
const db = mysql.createPool({
    host: dbHost,
    user: 'root',
    password: 'CULTUREAPP',
    database: 'ResidentAppDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// Root path for health check
app.get('/', (req, res) => {
    res.status(200).send('Hello World!');

});

// Endpoint to get count of samples
app.get('/getSampleCount', (req, res) => {
  const query = 'SELECT COUNT(*) as count FROM Samples';
  
  db.query(query, (err, result) => {
    if (err) throw err;
    res.json({ count: result[0].count });
  });
});


app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Example of logging incoming requests
app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
  });
  
  // More detailed error handling
  app.use((err, req, res, next) => {
    console.error(`Internal server error on ${req.method} ${req.url}:`, err);
    res.status(500).send('Internal Server Error');
  });

app.use(express.json()); // To handle JSON payloads

// Register a user
app.post('/register', (req, res) => {
    let Email = req.body.Email;
    let Password = req.body.Password;

    // First, hash the Password
    bcrypt.hash(Password, 10, (err, hashedPassword) => {
        if (err) {
            res.json({ success: false, message: 'Error hashing Password.' });
            return;
        }

        // Insert the new user into the database with hashed Password
        const query = "INSERT INTO Users (Email, Password) VALUES (?, ?)";
        db.query(query, [Email, hashedPassword], (err, results) => {
            if (err) {
                res.json({ success: false, message: 'Error registering user.' });
                return;
            }

            res.json({ success: true });
        });
    });
});


// Register a user
app.post('/changepasswordloggedin', (req, res) => {
    let newpassword = req.body.newPassword;
    let confirmNewpassword = req.body.confirmNewPassword;
    let userId = req.session.userId;

    // Check if passwords match first
    if (newpassword !== confirmNewpassword) {
        return res.json({ success: false, message: 'Passwords do not match.' });
    }

    // hash the Newpassword if they match
    bcrypt.hash(newpassword, 10, (err, hashedPassword) => {
        if (err) {
            res.json({ success: false, message: 'Error hashing Password.' });
            return;
        }

    // Update the user's password in the database with the hashed password
    const query = "UPDATE UserAccounts SET Password = ? WHERE UserID = ?";
    db.query(query, [hashedPassword, userId], (err, results) => {
        if (err) {
            res.json({ success: false, message: 'Error updating password.' });
            return;
        }

        res.json({ success: true, message: 'Password updated successfully.' });
    });
    });
});


// Login to account
app.post('/login', (req, res) => {
    console.log("Before Login Session:", req.session);
    let Email = req.body.username;
    let Password = req.body.password;
    const query = "SELECT * FROM UserAccounts WHERE Email = ?";
    db.query(query, [Email], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(Password, user.Password, (err, isMatch) => { // Compare the hashed Password
                if (isMatch) {
                    req.session.loggedin = true;
                    req.session.Email = Email;
                    req.session.userId = user.UserID;
                    console.log("After Login Session:", req.session);
                    res.json({ success: true });
                    console.log("Immediately after setting:", req.session.loggedin);
                } else {
                    res.json({ success: false, message: 'Incorrect Password!' });
                }
            });
        } else {
            res.json({ success: false, message: 'Email does not exist!' });
        }
    });
});

app.get('/checkLogin', (req, res) => {
    console.log('Session:', req.session); // Log the session data
    
    if (req.session.loggedin) {
        res.json({ loggedin: true });
    } else {
        res.json({ loggedin: false });
    }
});

app.post('/logout', (req, res) => {
    if (req.session) {
        // Destroy the session
        req.session.destroy(err => {
            if (err) {
                // Handle error during session destruction
                res.json({ success: false, message: 'Error logging out.' });
            } else {
                res.clearCookie('connect.sid'); // if you're using express-session
                res.json({ success: true });
            }
        });
    } else {
        res.json({ success: false, message: 'No session to destroy.' });
    }
});


app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

module.exports = { app, db };
