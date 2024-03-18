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

router.post('/send-maintenance-request', (req, res) => {
    const { firstName, lastName, email, phone, maintenanceType, details } = req.body;
    const apartment = req.session.apartmentNumber;

        // Define mail options
        const mailOptions = {
            from: 'CSE696ResidentApp@gmail.com',
            to: 'amcombs2000@gmail.com',
            subject: maintenanceType,
            text: `${firstName} ${lastName} has put in a maintence request for apartment ${apartment}. The details are as follows: ${details}. You can contact them at ${email} or ${phone}`
        };

        // Send email with the token
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.json({ success: false, message: 'Failed to send email.' });
            }

            // Store the token in the database
            //const query = 'INSERT INTO ResetToken (Email, ResetToken) VALUES (?, ?) ON DUPLICATE KEY UPDATE ResetToken = ?';
            //db.query(query, [email, resetToken, resetToken], (dbError, dbResults) => {
            //    if (dbError) {
            //        console.error('Error saving reset token to database:', dbError);
           //         return res.json({ success: false, message: 'Failed to save reset token.' });
            //    }
            //    return res.json({ success: true, message: 'Reset token sent to email.' });
            //});
        });
});

module.exports = router;