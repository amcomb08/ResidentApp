const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const e = require('express');
const crypto = require('crypto');

const app = express();
const port = 5000;

// CORS middleware setup
app.use(cors({
  origin: 'http://localhost:8080', // This is where your front-end is hosted
  credentials: true
}));

// Middleware
app.use(bodyParser.json());

// Nodemailer setup (NEED TO ADD TO SECRETS)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
       user: 'CSE696ResidentApp@gmail.com', 
       pass: 'xhmq jwmn wpqo ipki' 
    }
   });   

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


// Change user password
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

// Change user password
app.post('/changepasswordwithlink', (req, res) => {
    let newpassword = req.body.newPassword;
    let confirmNewpassword = req.body.confirmNewPassword;
    let userId = req.session.resetEmail;

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
    const query = "UPDATE UserAccounts SET Password = ? WHERE Email = ?";
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

//Check if a user is logged in
app.get('/checkLogin', (req, res) => {
    console.log('Session:', req.session); // Log the session data
    
    if (req.session.loggedin) {
        res.json({ loggedin: true });
    } else {
        res.json({ loggedin: false });
    }
});

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

app.post('/send-reset-code', (req, res) => {
    const { email } = req.body;
    // First, verify the email exists in the UserAccounts table
    const emailCheckQuery = 'SELECT * FROM UserAccounts WHERE Email = ?';
    db.query(emailCheckQuery, [email], (emailErr, emailResults) => {
        if (emailErr) {
            console.error('Database query error:', emailErr);
            return res.json({ success: false, message: 'Database query error.' });
        }
        if (emailResults.length === 0) {
            return res.json({ success: false, message: 'Email does not exist.' });
        }

        // Email exists, proceed with reset token generation
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Define mail options
        const mailOptions = {
            from: 'CSE696ResidentApp@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `Your reset token is: ${resetToken}`
        };

        // Send email with the token
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.json({ success: false, message: 'Failed to send email.' });
            }

            // Store the token in the database
            const query = 'INSERT INTO ResetToken (Email, ResetToken) VALUES (?, ?) ON DUPLICATE KEY UPDATE ResetToken = ?';
            db.query(query, [email, resetToken, resetToken], (dbError, dbResults) => {
                if (dbError) {
                    console.error('Error saving reset token to database:', dbError);
                    return res.json({ success: false, message: 'Failed to save reset token.' });
                }
                return res.json({ success: true, message: 'Reset token sent to email.' });
            });
        });
    });
});

app.post('/verify-reset-code', async (req, res) => {
    const { email, verificationCode } = req.body;
    // Fetch the stored token from the database
    const query = "SELECT ResetToken FROM ResetToken WHERE Email = ?";
    db.query(query, [email], (err, results) => {
        if (err) {
            res.json({ success: false, message: 'Database query failed.' });
            return;
        }
        if (results.length > 0 && results[0].ResetToken === verificationCode) {
            req.session.loggedin = false;
            req.session.userId = email;
            req.session.save();
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid verification code.' });
        }
    });
});

app.get('/getPaymentsDue', (req, res) => {
    const userID = req.session.userId;
    console.log('User ID:', userID);
    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }
    const getUserApartmentQuery = 'SELECT ApartmentNumber FROM UserAccounts WHERE UserID = ?';

    db.query(getUserApartmentQuery, [userID], (err, userResults) => {
        if (err || userResults.length === 0) {
            return res.json({ success: false, message: 'Failed to find user apartment number.' });
        }

        const apartmentNumber = userResults[0].ApartmentNumber;
        const getPaymentDueQuery = 'SELECT PaymentAmount FROM PaymentsDue WHERE ApartmentNumber = ?';

        db.query(getPaymentDueQuery, [apartmentNumber], (err, paymentResults) => {
            if (err || paymentResults.length === 0) {
                return res.json({ success: false, message: 'Failed to find payment amount.' });
            }

            const paymentAmount = paymentResults[0].PaymentAmount;
            return res.json({ success: true, paymentAmount: paymentAmount });
        });
    });
});

app.post('/addpayment', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        cardName,
        cardExpiry,
        cardNumber,
        cardCVV,
        cardNickname,
        addressCountry,
        addressCity,
        addressState,
        addressZip,
        addressStreet
    } = req.body;

    const UserID = req.session.userId; // Obtain UserID from the session

    // Construct the insert query
    const insertQuery = `
        INSERT INTO PaymentMethods (
            NameOnCard,
            Expiry,
            CardNum,
            CVV,
            CardNickname,
            Country,
            City,
            State,
            Zip,
            Address,
            UserID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the insert query
    db.query(insertQuery, [
        cardName,
        cardExpiry,
        cardNumber,
        cardCVV,
        cardNickname,
        addressCountry,
        addressCity,
        addressState,
        addressZip,
        addressStreet,
        UserID
    ], (err, results) => {
        if (err) {
            console.error('Database insert error:', err);
            return res.json({ success: false, message: 'Database insert error.' });
        }

        // Successfully inserted data
        return res.json({ success: true, message: 'Payment method added successfully.' });
    });
});

app.get('/getPaymentMethods', (req, res) => {
    const userID = req.session.userId;
    console.log('User ID:', userID);

    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getPaymentMethodsQuery = 'SELECT CardID, CardNickname FROM PaymentMethods WHERE UserID = ?';

    db.query(getPaymentMethodsQuery, [userID], (err, paymentMethodsResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error occurred.' });
        }
        if (paymentMethodsResults.length === 0) {
            return res.json({ success: false, message: 'No payment methods found.' });
        }

        // Sending the payment methods directly
        return res.json({ success: true, paymentMethods: paymentMethodsResults });
    });
});




app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

module.exports = { app, db };
