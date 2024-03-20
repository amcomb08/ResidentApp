const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const crypto = require('crypto');


router.post('/addUser', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    console.log("Adding user:", req.body);

    const {
        FirstName,
        LastName,
        Email,
        Role,
        ApartmentNumber,
        Phone,
        DefaultPass
    } = req.body;

    // Construct the insert query
    const insertQuery = `
        INSERT INTO UserAccounts (
            UserRole,
            Email,
            Password,
            FirstName,
            LastName,
            PhoneNumber,
            ApartmentNumber
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    //Hash the default password
    bcrypt.hash(DefaultPass, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.json({ success: false, message: 'Error hashing password.' });
        }
        const hashedPass = hash;

        // Execute the insert query
        db.query(insertQuery, [
            Role,
            Email,
            hashedPass,
            FirstName,
            LastName,
            Phone,
            ApartmentNumber
        ], (err, results) => {
            if (err) {
                console.error('Database insert error:', err);
                return res.json({ success: false, message: 'Database insert error.' });
            }

            // Successfully inserted data
            return res.json({ success: true, message: 'User added successfully.' });
        });
    });
});









module.exports = router;