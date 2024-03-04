const express = require('express');
const router = express.Router();
const db = require('./db');

router.post('/makePayment', (req, res) => {
    const userID = req.session.userId;
    const { paymentMethod,paymentAmount } = req.body; // The amount of payment to make

    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    // Get a connection from the pool
    db.getConnection((err, connection) => {
        if (err) {
            res.json({ success: false, message: 'Error getting database connection.' });
            return;
        }

        // Start a new transaction
        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                res.json({ success: false, message: 'Error starting transaction.' });
                return;
            }

            // Get the user's apartment number
            const getUserApartmentQuery = 'SELECT ApartmentNumber FROM UserApartments WHERE UserID = ?';
            connection.query(getUserApartmentQuery, [userID], (err, userResults) => {
                if (err || userResults.length === 0) {
                    connection.rollback(() => {
                        connection.release();
                        res.json({ success: false, message: 'Failed to find user apartment number.' });
                    });
                    return;
                }

                const apartmentNumber = userResults[0].ApartmentNumber;
                const getPaymentDueQuery = 'SELECT PaymentAmount FROM PaymentsDue WHERE ApartmentNumber = ?';
                connection.query(getPaymentDueQuery, [apartmentNumber], (err, userBalanceResults) => {
                    if (err || userBalanceResults.length === 0) {
                        connection.rollback(() => {
                            connection.release();
                            res.json({ success: false, message: 'Failed to find user balance.' });
                        });
                        return;
                    }

                    const userBalanceNumber = parseFloat(userBalanceResults[0].PaymentAmount);
                    const userAmountNumber = parseFloat(paymentAmount);
                    
                    //Check if the payment amount is greater than the user's balance
                    if (userAmountNumber > userBalanceNumber) {
                        connection.rollback(() => {
                            connection.release();
                            res.json({ success: false, message: 'Payment Amount exceeds current due balance' });
                        });
                        return;
                    }

                    // Update the PaymentsDue table
                    const updatePaymentQuery = `
                        UPDATE PaymentsDue
                        SET PaymentAmount = PaymentAmount - ?
                        WHERE ApartmentNumber = ?
                    `;
                    connection.query(updatePaymentQuery, [paymentAmount, apartmentNumber], (err, updateResults) => {
                        if (err) {
                            console.error('Error during payment update:', err);
                            connection.rollback(() => {
                                connection.release();
                                res.json({ success: false, message: 'Failed to update payment amount.' });
                            });
                            return;
                        }
                        // Commit the transaction
                        connection.commit(err => {
                            if (err) {
                                connection.rollback(() => {
                                    connection.release();
                                    res.json({ success: false, message: 'Error committing transaction.' });
                                });
                                return;
                            }
                            connection.release();
                            res.json({ success: true, message: 'Payment made successfully.' });
                        });
                    });
                });
            });
        });
    });
});

router.get('/getPaymentMethods', (req, res) => {
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

router.post('/addpayment', (req, res) => {
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

router.get('/getPaymentDue', (req, res) => {
    const userID = req.session.userId;

    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }
    const getUserApartmentQuery = 'SELECT ApartmentNumber FROM UserAccounts WHERE UserID = ?';

    db.query(getUserApartmentQuery, [userID], (err, userResults) => {
        if (err || userResults.length === 0) {
            return res.json({ success: false, message: 'Failed to find user apartment number.' });
        }

        const apartmentNumber = userResults[0].ApartmentNumber;
        req.session.apartmentNumber = apartmentNumber;

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

router.post('/updatePaymentHistory', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }
    const {paymentMethod, paymentAmount, paymentNote, paymentDate} = req.body;

    const userID = req.session.userId; // Obtain UserID from the session
    const userApartment = req.session.apartmentNumber; // Obtain UserApartment from the session

    // Construct the insert query
    const insertQuery = `
        INSERT INTO PaymentsMade (
            PaymentMethodID,
            UserID,
            ApartmentNumber,
            Amount,
            Status,
            Date,
            Notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the insert query
    db.query(insertQuery, [
        paymentMethod,
        userID,
        userApartment,
        paymentAmount,
        'Paid',
        paymentDate,
        paymentNote
    ], (err, results) => {
        if (err) {
            console.error('Database insert error:', err);
            return res.json({ success: false, message: 'Database insert error.' });
        }

        // Successfully inserted data
        return res.json({ success: true, message: 'Payment method added successfully.' });
    });
});

module.exports = router;
