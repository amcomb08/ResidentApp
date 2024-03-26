const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const e = require('express');
const paymentRoutes = require('./routes/paymentRoutes');
const loginRoutes = require('./routes/loginRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const communityAdminRoutes = require('./routes/communityAdminRoutes');

const app = express();
const port = 5000;

// CORS middleware setup
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true
  }));

// Middleware
app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Root path for health check
app.get('/', (req, res) => {
    res.status(200).send('Hello World!');

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


const db = require('./routes/db');
app.use('/payments', paymentRoutes);
app.use('/login', loginRoutes);
app.use('/message', messageRoutes);
app.use('/reservation', reservationRoutes);
app.use('/adminRoutes', adminRoutes);
app.use('/communityAdmin', communityAdminRoutes);


// Logout
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
