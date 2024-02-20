const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');

const app = express();
const port = 5000;

// CORS middleware setup
app.use(cors({
  origin: 'http://localhost:8080', // This is where your front-end is hosted
  credentials: true
}));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Database connection pool setup
const dbHost = process.env.DB_HOST || 'localhost';
const db = mysql.createPool({
    host: dbHost,
    user: 'root',
    password: 'CULTUREAPP',
    database: 'culture-app-db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// Root path for health check
app.get('/', (req, res) => {
    res.status(200).send('Hello World!');

});

// Endpoint to get samples
app.get('/samples', (req, res) => {
  const query = 'SELECT * FROM Samples';
  
  db.query(query, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// Endpoint to get count of samples
app.get('/getSampleCount', (req, res) => {
  const query = 'SELECT COUNT(*) as count FROM Samples';
  
  db.query(query, (err, result) => {
    if (err) throw err;
    res.json({ count: result[0].count });
  });
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

// Registration route
app.post('/register', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    // First, hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            res.json({ success: false, message: 'Error hashing password.' });
            return;
        }

        // Insert the new user into the database with hashed password
        const query = "INSERT INTO Users (username, password) VALUES (?, ?)";
        db.query(query, [username, hashedPassword], (err, results) => {
            if (err) {
                res.json({ success: false, message: 'Error registering user.' });
                return;
            }

            res.json({ success: true });
        });
    });
});


// Login route
app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    const query = "SELECT * FROM Users WHERE username = ?";
    db.query(query, [username], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (isMatch) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    req.session.userId = user.id;
                    console.log("After Login Session:", req.session);
                    res.json({ success: true });
                    console.log("Immediately after setting:", req.session.loggedin);
                } else {
                    res.json({ success: false, message: 'Incorrect Password!' });
                }
            });
        } else {
            res.json({ success: false, message: 'Username does not exist!' });
        }
    });
});

app.post('/saveChoice', (req, res) => {
    // Retrieve data from the request body
    const userId = req.session.userId;
    const sampleId = req.body.sampleId;
    const choice = req.body.choice;

    // Check if the user has already made a choice for the given sampleId
    const checkQuery = "SELECT * FROM User_Choices WHERE user_id = ? AND sample_id = ?";
    db.query(checkQuery, [userId, sampleId], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            // Update existing choice
            const updateQuery = "UPDATE User_Choices SET choice = ? WHERE user_id = ? AND sample_id = ?";
            db.query(updateQuery, [choice, userId, sampleId], (err, results) => {
                if (err) {
                    res.json({ success: false, message: 'Error updating choice.' });
                    return;
                }
                res.json({ success: true, message: 'Choice updated successfully.' });
            });
        } else {
            // Insert new choice
            const insertQuery = "INSERT INTO User_Choices (user_id, sample_id, choice) VALUES (?, ?, ?)";
            db.query(insertQuery, [userId, sampleId, choice], (err, results) => {
                if (err) {
                    res.json({ success: false, message: 'Error saving choice.' });
                    return;
                }
                res.json({ success: true, message: 'Choice saved successfully.' });
            });
        }
    });
});

app.get('/getUserChoices', (req, res) => {
    // Use the userID stored in the session
    const userId = req.session.userId;
    console.log(userId)
    if (!userId) {
        res.json({ success: false, message: 'User not authenticated.' });
        return;
    }

    // Construct a query to get the user choices
    const selectQuery = "SELECT sample_id FROM User_Choices WHERE user_id = ?";
    db.query(selectQuery, [userId], (err, results) => {
        if (err) {
            res.json({ success: false, message: 'Error fetching choices.' });
            return;
        }

        const processedSamples = results.map(row => row.sample_id);
        res.json({ success: true, data: processedSamples });
    });
});

app.post('/insertSamplesToReader', (req, res) => {
    const userId = req.session.userId;
    const samples = req.body.samples;

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

            const insertQuery = "INSERT INTO Reader (user_id, sample_id) VALUES ?";
            const values = samples.map(sampleId => [userId, sampleId]);

            // Perform the query using the obtained connection
            connection.query(insertQuery, [values], (err) => {
                if (err) {
                    connection.rollback(() => {
                        connection.release();
                        res.json({ success: false, message: 'Error inserting samples.' });
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
                    res.json({ success: true });
                });
            });
        });
    });
});

app.get('/getReaderSamples', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        res.json({ success: false, message: 'User not authenticated.' });
        return;
    }

    const selectQuery = "SELECT sample_id FROM Reader WHERE user_id = ?";
    db.query(selectQuery, [userId], (err, results) => {
        if (err) {
            res.json({ success: false, message: 'Error fetching sample IDs.' });
            return;
        }

        const visibleSampleIds = results.map(row => row.sample_id);
        res.json({ success: true, data: visibleSampleIds });
    });
});

app.post('/deleteReaderSample', (req, res) => {
    const userId = req.session.userId;
    const sampleBarcode = req.body.sampleBarcode;

    if (!userId) {
        res.json({ success: false, message: 'User not authenticated.' });
        return;
    }

    if (!sampleBarcode) {
        res.json({ success: false, message: 'Sample barcode not provided.' });
        return;
    }

    // Get a connection from the pool
    db.getConnection((err, connection) => {
        if (err) {
            return res.json({ success: false, message: 'Error getting database connection.', error: err });
        }

        // Start a transaction
        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                return res.json({ success: false, message: 'Transaction failed to start.', error: err });
            }

            // Delete the sample from the Reader table
            const deleteQuery = "DELETE FROM Reader WHERE user_id = ? AND sample_id = ?";
            connection.query(deleteQuery, [userId, sampleBarcode], (err, deleteResult) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        res.json({ success: false, message: 'Error deleting sample.', error: err });
                    });
                }

                // If delete is successful, insert into SubmittedSamples
                const insertQuery = "INSERT INTO SubmittedSamples (user_id, sample_id) VALUES (?, ?)";
                connection.query(insertQuery, [userId, sampleBarcode], (err, insertResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            res.json({ success: false, message: 'Error inserting into SubmittedSamples.', error: err });
                        });
                    }

                    // Commit the transaction
                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                res.json({ success: false, message: 'Transaction failed to commit.', error: err });
                            });
                        }

                        // Release the connection back to the pool
                        connection.release();

                        // If all is good, send success response
                        res.json({ success: true, message: 'Sample deleted and logged successfully.' });
                    });
                });
            });
        });
    });
});

app.get('/getSampleDetails', (req, res) => {
    const barcode = req.query.barcode;

    if (!barcode) {
        res.json({ success: false, message: 'No barcode provided.' });
        return;
    }

    const selectQuery = "SELECT * FROM Samples WHERE barcode = ?";
    db.query(selectQuery, [barcode], (err, results) => {
        if (err) {
            res.json({ success: false, message: 'Error fetching sample details.' });
            return;
        }

        if (results.length > 0) {
            const sampleDetails = results[0]; // Assuming barcode is unique and returns only one record
            res.json({ success: true, sampleImage: sampleDetails.imageName, ...sampleDetails });
        } else {
            res.json({ success: false, message: 'No sample found with the provided barcode.' });
        }
    });
});


app.get('/checkLogin', (req, res) => {
    console.log('Session:', req.session); // Log the session data
    
    if (req.session.loggedin) {
        res.json({ loggedin: true });
    } else {
        res.json({ loggedin: false });
    }
});

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

app.get('/getCurrentUserId', (req, res) => {
    res.json({ userId: req.session.userId });
});


app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

module.exports = { app, db };
