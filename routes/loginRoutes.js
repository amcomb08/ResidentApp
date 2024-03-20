const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const crypto = require('crypto');

// Nodemailer setup (NEED TO ADD TO SECRETS)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
       user: 'CSE696ResidentApp@gmail.com', 
       pass: 'htro tqlp kqtr kzvf' 
    }
});   


// Login to account
router.post('/login', (req, res) => {
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
                    req.session.UserRole = user.UserRole;
                    console.log("After Login Session:", req.session);
                    res.json({ success: true, userRole: user.UserRole});
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
router.get('/checkLogin', (req, res) => {
    console.log('Session:', req.session); // Log the session data
    
    if (req.session.loggedin) {
        res.json({ loggedin: true, userRole: req.session.UserRole});
    } else {
        res.json({ loggedin: false });
    }
});

router.post('/send-reset-code', (req, res) => {
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

router.post('/verify-reset-code', async (req, res) => {
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

// Change user password
router.post('/changepasswordloggedin', (req, res) => {
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
router.post('/changepasswordwithlink', (req, res) => {
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

// Register a user
router.post('/register', (req, res) => {
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





module.exports = router;