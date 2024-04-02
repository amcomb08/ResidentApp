const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const crypto = require('crypto');


router.post('/addUser', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        FirstName,
        LastName,
        Email,
        Role,
        ApartmentNumber,
        Phone,
        DefaultPass
    } = req.body;

    // Get a connection from the pool
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting database connection:', err);
            return res.json({ success: false, message: 'Error getting database connection.' });
        }

        // Hash the default password
        bcrypt.hash(DefaultPass, 10, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                connection.release();
                return res.json({ success: false, message: 'Error hashing password.' });
            }
            const hashedPass = hash;

            // Start a transaction
            connection.beginTransaction((err) => {
                if (err) {
                    console.error('Transaction start error:', err);
                    connection.release();
                    return res.json({ success: false, message: 'Transaction start error.' });
                }

                // Execute the insert query
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
                connection.query(insertQuery, [
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
                        connection.rollback(() => {
                            connection.release();
                            return res.json({ success: false, message: 'Database insert error.' });
                        });
                        return;
                    }

                    // Check if the apartment is not occupied
                    const checkOccupiedQuery = `
                        SELECT IsOccupied FROM Apartments WHERE ApartmentNumber = ?
                    `;
                    connection.query(checkOccupiedQuery, [ApartmentNumber], (err, apartments) => {
                        if (err) {
                            console.error('Error checking apartment occupation status:', err);
                            connection.rollback(() => {
                                connection.release();
                                return res.json({ success: false, message: 'Error checking apartment occupation status.' });
                            });
                            return;
                        }

                        if (apartments.length > 0 && apartments[0].IsOccupied === 0) {
                            // Update the IsOccupied status
                            const updateOccupiedQuery = `
                                UPDATE Apartments SET IsOccupied = 1 WHERE ApartmentNumber = ?
                            `;
                            connection.query(updateOccupiedQuery, [ApartmentNumber], (err, updateResults) => {
                                if (err) {
                                    console.error('Error updating apartment occupation status:', err);
                                    connection.rollback(() => {
                                        connection.release();
                                        return res.json({ success: false, message: 'Error updating apartment occupation status.' });
                                    });
                                    return;
                                }

                                // Commit the transaction
                                connection.commit((err) => {
                                    if (err) {
                                        console.error('Error committing transaction:', err);
                                        connection.rollback(() => {
                                            connection.release();
                                            return res.json({ success: false, message: 'Error during transaction commit.' });
                                        });
                                        return;
                                    }

                                    connection.release();
                                    return res.json({ success: true, message: 'User added and apartment status updated successfully.' });
                                });
                            });
                        } else {
                            // Apartment is already occupied or doesn't exist, just commit the transaction
                            connection.commit((err) => {
                                if (err) {
                                    console.error('Error committing transaction:', err);
                                    connection.rollback(() => {
                                        connection.release();
                                        return res.json({ success: false, message: 'Error during transaction commit.' });
                                    });
                                    return;
                                }

                                connection.release();
                                return res.json({ success: true, message: 'User added successfully.' });
                            });
                        }
                    });
                });
            });
        });
    });
});

router.post('/deleteUser', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        FirstName,
        LastName,
        Email
    } = req.body;

    // Construct the delete query
    const deleteQuery = `
        DELETE FROM UserAccounts
        WHERE Email = ?
        AND FirstName = ?
        AND LastName = ?
    `;

        // Execute the insert query
        db.query(deleteQuery, [
            Email,
            FirstName,
            LastName
        ], (err, results) => {
            if (err) {
                console.error('Failed to delete user.', err);
                return res.json({ success: false, message: 'Failed to delete user.' });
            }

            if (results.affectedRows > 0) {
                res.json({ success: true, message: 'User successfully deleted.' });
            } else {
                res.json({ success: false, message: 'No user found with that information.' });
            }
        });
});

router.post('/submitMonthly', (req, res) => {
    // Check if the user is logged in and has a session
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

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const formattedDate = thirtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
            
            const checkQuery = `
                SELECT 1 FROM PaymentsDue 
                WHERE DueDate > ? AND IsMonthly = 1
            `;
            
            connection.query(checkQuery, [formattedDate], (err, checkResults) => {
                if (err) {
                    connection.rollback(() => {
                        connection.release();
                        res.json({ success: false, message: 'Error checking for existing payments.' });
                    });
                    return 
                }

                if (checkResults.length > 0) {
                    connection.rollback(() => {
                        connection.release();
                        res.json({ success: false, message: 'Monthly payment has already been submitted this month.' });
                    });
                    return 
                }

                const apartmentQuery = `
                    SELECT 
                    UA.ApartmentNumber,
                    A.Rent
                    FROM UserAccounts UA
                    JOIN Apartments A ON UA.ApartmentNumber = A.ApartmentNumber
                    WHERE UA.ApartmentNumber IS NOT NULL
                    GROUP BY UA.ApartmentNumber, A.Rent
                `;
                connection.query(apartmentQuery, (err, apartments) => {
                    if (err) {
                        connection.rollback(() => {
                            connection.release();
                            res.json({ success: false, message: 'Error fetching apartments.' });
                        });
                        return
                    }

                    const twoWeeksLater = new Date();
                    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
                    const formattedDueDate = twoWeeksLater.toISOString().slice(0, 19).replace('T', ' ');

                    const paymentsData = apartments.map(apartment => [
                        formattedDueDate,
                        apartment.ApartmentNumber,
                        apartment.Rent,
                        1,
                        'Monthly payment'
                    ]);

                    const insertQuery = `
                        INSERT INTO PaymentsDue (DueDate, ApartmentNumber, PaymentAmount, IsMonthly, Comment)
                        VALUES ?;
                    `;

                    connection.query(insertQuery, [paymentsData], (err, results) => {
                        if (err) {
                            console.error('Error during batch insert:', err); // Log the detailed error to the console
                            connection.rollback(() => {
                                connection.release();
                                res.json({ success: false, message: 'Error inserting monthly payments.', error: err.message });
                            });
                            return;
                        }
                    
                        // Insert/update the ApartmentBalances for each apartment
                        const balanceQueries = apartments.map(apartment => {
                            return new Promise((resolve, reject) => {
                                const updateBalanceQuery = `
                                    INSERT INTO ApartmentBalances (ApartmentNumber, TotalAmountDue)
                                    VALUES (?, ?)
                                    ON DUPLICATE KEY UPDATE TotalAmountDue = TotalAmountDue + VALUES(TotalAmountDue);
                                `;
                    
                                connection.query(updateBalanceQuery, [apartment.ApartmentNumber, apartment.Rent], (err, updateResults) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(updateResults);
                                });
                            });
                        });
                    
                        // Execute all balance update queries
                        Promise.all(balanceQueries)
                            .then(() => {
                                connection.commit(err => {
                                    if (err) {
                                        connection.rollback(() => {
                                            connection.release();
                                            res.json({ success: false, message: 'Error committing the transaction.' });
                                        });
                                        return;
                                    }
                                    connection.release();
                                    res.json({ success: true, message: 'Monthly payments submitted successfully.' });
                                });
                            })
                            .catch(err => {
                                console.error('Error during balance update:', err); // Log the detailed error to the console
                                connection.rollback(() => {
                                    connection.release();
                                    res.json({ success: false, message: 'Error updating apartment balances.', error: err.message });
                                });
                            });
                    });
                });
            });
        });
    });
});

router.post('/submitCustom', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        DueDate,
        AptNum,
        Amount,
        Comment
    } = req.body;

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

            // Construct the insert query for PaymentsDue
            const insertQuery = `
                INSERT INTO PaymentsDue (
                    DueDate,
                    ApartmentNumber,
                    PaymentAmount,
                    IsMonthly,
                    Comment
                ) VALUES (?, ?, ?, 0, ?)
            `;

            // Execute the insert query for PaymentsDue
            connection.query(insertQuery, [DueDate, AptNum, Amount, Comment], (err, insertResults) => {
                if (err) {
                    console.error('Database insert error:', err);
                    connection.rollback(() => {
                        connection.release();
                        return res.json({ success: false, message: 'Database insert error.' });
                    });
                    return;
                }

                // Construct the update query for ApartmentBalances
                const updateBalanceQuery = `
                    INSERT INTO ApartmentBalances (ApartmentNumber, TotalAmountDue)
                    VALUES (?, ?)
                    ON DUPLICATE KEY UPDATE TotalAmountDue = TotalAmountDue + ?
                `;

                // Execute the update query for ApartmentBalances
                connection.query(updateBalanceQuery, [AptNum, Amount, Amount], (err, updateResults) => {
                    if (err) {
                        console.error('Database update error:', err);
                        connection.rollback(() => {
                            connection.release();
                            return res.json({ success: false, message: 'Database update error.' });
                        });
                        return;
                    }

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
                        res.json({ success: true, message: 'Payment added and balance updated successfully.' });
                    });
                });
            });
        });
    });
});
    
    

module.exports = router;