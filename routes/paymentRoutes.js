const express = require('express');
const router = express.Router();
const db = require('./db');
const crypto = require('crypto');

const ENCRYPTION_KEY = Buffer.from('9d239dba523edf58c16ed1da22dab2993636cffefa004629ca951dc6912004ac', 'hex'); // Convert hex string to Buffer
const IV = Buffer.from('69ad758cc498b163092818cf16642487', 'hex'); // Convert hex string to Buffer

function encrypt(text) {
    let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let encrypted = cipher.update(text, 'utf8', 'hex'); // Specify input encoding and output encoding
    encrypted += cipher.final('hex'); // Specify output encoding
    return encrypted;
}

function decrypt(encryptedText) {
    let encryptedBuffer = Buffer.from(encryptedText, 'hex');

    let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}



router.post('/makePayment', (req, res) => {
    const userID = req.session.userId;
    const { paymentAmount } = req.body; // The amount of payment to make

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
            const getUserApartmentQuery = 'SELECT ApartmentNumber FROM UserAccounts WHERE UserID = ?';
            connection.query(getUserApartmentQuery, [userID], (err, userResults) => {
                if (err || userResults.length === 0) {
                    connection.rollback(() => {
                        connection.release();
                        res.json({ success: false, message: 'Failed to find user apartment number.' });
                    });
                    return;
                }

                const apartmentNumber = userResults[0].ApartmentNumber;
                const getPaymentDueQuery = 'SELECT TotalAmountDue FROM ApartmentBalances WHERE ApartmentNumber = ?';
                connection.query(getPaymentDueQuery, [apartmentNumber], (err, userBalanceResults) => {
                    if (err || userBalanceResults.length === 0) {
                        connection.rollback(() => {
                            connection.release();
                            res.json({ success: false, message: 'Failed to find user balance.' });
                        });
                        return;
                    }

                    const userBalanceNumber = parseFloat(userBalanceResults[0].TotalAmountDue);
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
                        UPDATE ApartmentBalances
                        SET TotalAmountDue = TotalAmountDue - ?
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

    const getPaymentMethodsQuery = 'SELECT CardID, CardNickname, Expiry, CardNum, NameOnCard FROM PaymentMethods WHERE UserID = ?';

    db.query(getPaymentMethodsQuery, [userID], (err, paymentMethodsResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error occurred.' });
        }
        if (paymentMethodsResults.length === 0) {
            return res.json({ success: false, message: 'No payment methods found.' });
        }

        // Decrypt CardNum for each payment method
        const decryptedPaymentMethods = paymentMethodsResults.map(method => {
            const decryptedCardNum = decrypt(method.CardNum);
            return {
                ...method,
                CardNum: decryptedCardNum.slice(-4), 
                FullCardNum: decryptedCardNum
            };
        });

        // Sending the decrypted payment methods
        return res.json({ success: true, paymentMethods: decryptedPaymentMethods });
    });
});

router.get('/getPaymentHistory', (req, res) => {
    const userID = req.session.userId;
    console.log('User ID:', userID);

    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getPaymentHistoryQuery = 'SELECT Amount, Status, Date, NameOnCard, CardNum FROM PaymentsMade WHERE UserID = ?';

    db.query(getPaymentHistoryQuery, [userID], (err, paymentHistoryResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error occurred.' });
        }
        if (paymentHistoryResults.length === 0) {
            return res.json({ success: false, message: 'No payment methods found.' });
        }

        // Decrypt CardNum for each payment method
        const decryptedPaymentHistory = paymentHistoryResults.map(method => {
            const decryptedCardNum = decrypt(method.CardNum);
            return {
                ...method,
                CardNum: decryptedCardNum.slice(-4), 
            };
        });

        // Sending the payment methods directly
        return res.json({ success: true, paymentHistory: decryptedPaymentHistory });
    });
});

router.post('/deletePaymentMethod', (req, res) => {
    const userID = req.session.userId;
    const {cardID} = req.body; // The amount of payment to make
    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getPaymentMethodsQuery = 'DELETE FROM PaymentMethods WHERE CardID = ?';

    db.query(getPaymentMethodsQuery, [cardID], (err, paymentMethodsResults) => {
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

router.get('/getPaymentsMadeThisMonth', (req, res) => {
    const userID = req.session.userId;
    console.log('User ID:', userID);

    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; 
    
    const query = `
    SELECT Amount 
    FROM PaymentsMade 
    WHERE UserID = ? 
    AND YEAR(Date) = ? 
    AND MONTH(Date) = ?`;
    
    db.query(query, [userID, currentYear, currentMonth], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error occurred.' });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: 'No payments made this month.' });
        }
        // Process and send the results as needed
        return res.json({ success: true, paymentsMadeThisMonth: results });
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
    // Encrypt cardNumber and CVV before storing them
    const encryptedCardNumber = encrypt(cardNumber);
    const encryptedCVV = encrypt(cardCVV);
    

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
        encryptedCardNumber,
        encryptedCVV,
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

        const getPaymentDueQuery = 'SELECT TotalAmountDue FROM ApartmentBalances WHERE ApartmentNumber = ?';

        db.query(getPaymentDueQuery, [apartmentNumber], (err, paymentResults) => {
            if (err || paymentResults.length === 0) {
                return res.json({ success: false, message: 'Failed to find payment amount.' });
            }

            const paymentAmount = paymentResults[0].TotalAmountDue;
            return res.json({ success: true, paymentAmount: paymentAmount });
        });
    });
});

router.post('/updatePaymentHistory', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }
    const {paymentAmount, paymentNote, paymentDate, paymentNameOnCard, paymentCardNumber} = req.body;

    const userID = req.session.userId;
    const userApartment = req.session.apartmentNumber; 
    const encryptedCardNumber = encrypt(paymentCardNumber);

    // Construct the insert query
    const insertQuery = `
        INSERT INTO PaymentsMade (
            UserID,
            ApartmentNumber,
            Amount,
            Status,
            Date,
            Notes,
            NameOnCard,
            CardNum
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the insert query
    db.query(insertQuery, [
        userID,
        userApartment,
        paymentAmount,
        'Paid',
        paymentDate,
        paymentNote,
        paymentNameOnCard,
        encryptedCardNumber
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
