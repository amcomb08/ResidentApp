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
    const maintenanceEmail = 'amcombs2000@gmail.com'; // Change this to the email of the maintenance person
    const senderID = req.session.userId;
    const receiverID = 5; // Change this to the ID of the maintenance person
    const messageText = `${firstName} ${lastName} has put in a maintence request for apartment ${apartment}. The details are as follows: ${details}. You can contact them at ${email} or ${phone}`

    // Define mail options
    const mailOptions = {
        from: 'CSE696ResidentApp@gmail.com',
        to: maintenanceEmail,
        subject: maintenanceType,
        text: messageText
    };

    // Send email with the token
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.json({ success: false, message: 'Failed to send email.' });
        }
        // Get a connection from the pool
        db.getConnection((err, connection) => {
            if (err) {
                return res.json({ success: false, message: 'Error getting database connection.' });
            }
            // Start a new transaction
            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    return res.json({ success: false, message: 'Error starting transaction.' });
                }
                    const insertQuery = `
                    INSERT INTO Messages (
                        SenderUserID,
                        ReceiverID,
                        Subject,
                        Message,
                        TimeStamp,
                        MessageType
                    ) VALUES (? , ? , ? , ? , ? , ?);
                `;

                    // Execute the insert query
                    connection.query(insertQuery, [
                        senderID,
                        receiverID,
                        "Maintenance Request",
                        messageText,
                        new Date(),
                        "Maintenance"
                    ], (err, results) => {
                        if (err) {
                            console.error('Database update error:', err);
                            connection.rollback(() => {
                                connection.release();
                                return res.json({ success: false, message: 'Database update error.' });
                            });
                            return;
                        }
                    });

                    connection.query(insertQuery, [
                        receiverID,
                        senderID,
                        "Maintenance Request",
                        "Your maintenance request has been sent to the maintenance team. They will contact you soon.",
                        new Date(),
                        "Maintenance"
                    ], (err, results) => {
                        if (err) {
                            console.error('Database update error:', err);
                            connection.rollback(() => {
                                connection.release();
                                return res.json({ success: false, message: 'Database update error.' });
                            });
                            return;
                        }
                    });

                    // Commit the transaction
                    connection.commit(err => {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            connection.rollback(() => {
                                connection.release();
                                return res.json({ success: false, message: 'Error committing transaction.' });
                            });
                            return;
                        }

                        // Release the connection and send a successful response
                        connection.release();
                        res.json({ success: true, message: 'Messages successfully sent' });
                    });
            });
        });
    });
});

router.post('/send-contact-message', (req, res) => {
    const { firstName, lastName, email, phone, message } = req.body;
    const apartment = req.session.apartmentNumber;

        // Define mail options
        const mailOptions = {
            from: 'CSE696ResidentApp@gmail.com',
            to: 'amcombs2000@gmail.com',
            subject: "Contact Message",
            text: `${firstName} ${lastName} from apartment ${apartment} has requested to contact you. The details are as follows: ${message}. You can contact them at ${email} or ${phone}`
        };

        // Send email with the token
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.json({ success: false, message: 'Failed to send email.' });
            }
        });
});

router.get('/get-events', (req, res) => {
    // You may or may not need to check for a user session, depending on whether this data should be public
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getEventsQuery = 'SELECT * FROM Events'; // Adjust if you need specific columns only

    db.query(getEventsQuery, (err, eventsResults) => {
        if (err) {
            console.error('Error fetching events:', err);
            return res.json({ success: false, message: 'Failed to fetch events.' });
        }

        // If you get results, send them back to the client
        if (eventsResults.length > 0) {
            return res.json({ success: true, events: eventsResults });
        } else {
            return res.json({ success: false, message: 'No events found.' });
        }
    });
});

router.get('/get-announcements', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getAnnouncementsQuery = 'SELECT * FROM Announcements';

    db.query(getAnnouncementsQuery, (err, announcementResults) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to retrieve announcements.' });
        }

        // If you get results, send them back to the client
        if (announcementResults.length > 0) {
            return res.json({ success: true, announcements: announcementResults });
        } else {
            return res.json({ success: false, message: 'No events found.' });
        }
    });
});

router.get('/get-messages', (req, res) => {
    // You may or may not need to check for a user session, depending on whether this data should be public
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }
    const userId = req.session.userId;
    const getMessagesQuery = 'SELECT * FROM Messages WHERE ReceiverID = ? ORDER BY TimeStamp DESC;';

    db.query(getMessagesQuery,[userId,userId],(err, messageResults) => {
        if (err) {
            console.error('Error fetching events:', err);
            return res.json({ success: false, message: 'Failed to fetch events.' });
        }

        // If you get results, send them back to the client
        if (messageResults.length > 0) {
            return res.json({ success: true, messages: messageResults });
        } else {
            return res.json({ success: false, messages: 'No events found.' });
        }
    });
});

module.exports = router;