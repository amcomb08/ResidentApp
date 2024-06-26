const express = require('express');
const path = require('path');
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
const documentRoutes = require('./routes/documentRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// CORS middleware setup
app.use(cors({
    origin: process.env.CONNECTION_STRING,
    credentials: true
  }));

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SECRET_KEY, // replace with a strong random secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto', httpOnly: true } // set secure to true if you are using https
}));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, 'public')));

// Send index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/config', (req, res) => {
    const env = process.env.NODE_ENV || 'development';
    const configFile = env === 'production' ? 'config.prod.json' : 'config.dev.json';
    res.sendFile(configFile, { root: __dirname });
});
  
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

// Middleware
app.use(bodyParser.json());


const db = require('./routes/db');
app.use('/payments', paymentRoutes);
app.use('/login', loginRoutes);
app.use('/message', messageRoutes);
app.use('/reservation', reservationRoutes);
app.use('/adminRoutes', adminRoutes);
app.use('/communityAdmin', communityAdminRoutes);
app.use('/document', documentRoutes);


// Logout
app.post('/logout', (req, res) => {
    if (req.session) {
        // Destroy the session
        req.session.destroy(err => {
            if (err) {
                // Handle error during session destruction
                res.json({ success: false, message: 'Error logging out.' });
            } else {
                res.clearCookie('connect.sid');
                res.json({ success: true });
            }
        });
    } else {
        res.json({ success: false, message: 'No session to destroy.' });
    }
});

app.listen(port, () => {
    console.log(`Server started on: ${port}`);
  });
  

module.exports = { app, db };
