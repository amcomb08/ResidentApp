const express = require('express');
const router = express.Router();
const db = require('./db');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const upload = multer({ storage: multer.memoryStorage() });
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
}); 

router.post('/send-maintenance-request', (req, res) => {
    const { firstName, lastName, email, phone, maintenanceType, details } = req.body;
    const apartment = req.session.apartmentNumber;
    const maintenanceEmail = 'amcombs2000@gmail.com'; // Change this to the email of the maintenance person
    const senderID = req.session.userId;
    const receiverID = 1; // Change this to the account ID of the maintenance person
    const messageText = `${firstName} ${lastName} has put in a maintence request for apartment ${apartment}. The details are as follows: ${details}. You can contact them at ${email} or ${phone}`

    // Define mail options
    const mailOptions = {
        from: process.env.EMAIL_USER,
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
    const maintenanceEmail = process.env.EMAIL_USER; // Change this to the email of the contact person
    const senderID = req.session.userId;
    const receiverID = 1; // Change this to the account ID of the contact person
    const messageText = `${firstName} ${lastName} from apartment ${apartment} has requested to contact you. The details are as follows: ${message}. You can contact them at ${email} or ${phone}`

        // Define mail options
        const mailOptions = {
            from: 'CSE696ResidentApp@gmail.com',
            to: maintenanceEmail,
            subject: "Contact Message",
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
                        "Contact Request",
                        messageText,
                        new Date(),
                        "Contact"
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
                        "Contact Request",
                        "Your contact Request has been sent to the team. They will contact you soon.",
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

router.post('/send-late-notice', (req, res) => {
    const { apartmentNumber } = req.body;

    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'User is not logged in.' });
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

            // Query to get all user accounts for the apartment number
            const getUserEmailsQuery = 'SELECT Email, UserID FROM UserAccounts WHERE ApartmentNumber = ?';
            connection.query(getUserEmailsQuery, [apartmentNumber], (err, results) => {
                if (err) {
                    connection.rollback(() => {
                        connection.release();
                        return res.json({ success: false, message: 'Failed to retrieve user emails.' });
                    });
                    return;
                }

                // Check if there are any user emails to send notifications to
                if (results.length === 0) {
                    connection.rollback(() => {
                        connection.release();
                        return res.json({ success: false, message: 'No users found for this apartment.' });
                    });
                    return;
                }

                // Define the late notice text
                const lateNoticeText = `This is a notice that our records indicate there is a late payment for your apartment. Please address this as soon as possible or contact the front desk if you have any questions.`;

                // Send an email to each user's email address
                results.forEach(user => {
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: user.Email, // Recipient email address
                        subject: 'Late Payment Notice',
                        text: lateNoticeText
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            connection.rollback(() => {
                                connection.release();
                                return res.json({ success: false, message: 'Failed to send email.' });
                            });
                            return;
                        }
                    });

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

                    connection.query(insertQuery, [
                        1,
                        user.UserID,
                        "Late Payment Notice",
                        lateNoticeText,
                        new Date(),
                        "Late Payment"
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
                });

                // Commit the transaction after sending all emails
                connection.commit(err => {
                    if (err) {
                        connection.rollback(() => {
                            connection.release();
                            return res.json({ success: false, message: 'Failed to commit transaction.' });
                        });
                        return;
                    }

                    connection.release();
                    res.json({ success: true, message: 'Late payment notices sent successfully.' });
                });
            });
        });
    });
});

router.get('/get-events', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getEventsQuery = 'SELECT * FROM Events';

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