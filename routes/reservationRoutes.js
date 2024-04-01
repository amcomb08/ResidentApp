const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/getAmenities', (req, res) => {
    const userID = req.session.userId;

    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getAmenitiesQuery = 'SELECT AmenityID, AmenityName, Description FROM Amenities';

    db.query(getAmenitiesQuery, (err, amenitiesResults) => {
        if (err) {
            return res.json({ success: false, message: 'Failed to retrieve amenities.' });
        }

        if (amenitiesResults.length === 0) {
            // No amenities found case
            return res.json({ success: true, message: 'No amenities found.', amenities: [] });
        }

        // Successfully found amenities, return them
        return res.json({ success: true, amenities: amenitiesResults });
    });
});

router.get('/getAmenitySchedule/:amenityId', (req, res) => {
    const { amenityId } = req.params;
    console.log("amenityId is: ", amenityId);
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    const getScheduleQuery = 'SELECT ScheduleID, Date, StartTime, EndTime FROM AmenitySchedules WHERE AmenityID = ? AND Reserved = 0';

    db.query(getScheduleQuery, [amenityId], (err, schedules) => {
        if (err) {
            return res.json({ success: false, message: 'Failed to retrieve schedules.' });
        }

        return res.json({ success: true, schedules });
    });
});

router.post('/makeReservation', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        ScheduleID
    } = req.body;
    
    userID = req.session.userId;

    // Start a transaction
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting database connection:', err);
            return res.json({ success: false, message: 'Error getting database connection.' });
        }

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                console.error('Error starting transaction:', err);
                return res.json({ success: false, message: 'Error starting transaction.' });
            }
            
            // Construct the insert query for Reservations
            const insertQuery = `
                INSERT INTO Reservations (
                    UserID,
                    ScheduleID,
                    Status
                ) VALUES (?, ?, ?)
            `;
            
            connection.query(insertQuery, [userID, ScheduleID, 'Confirmed'], (err, results) => {
                if (err) {
                    connection.rollback(() => {
                        connection.release();
                        console.error('Database insert error:', err);
                        return res.json({ success: false, message: 'Database insert error.' });
                    });
                    return;
                }

                // Construct the update query for AmenitySchedules
                const updateQuery = `
                    UPDATE AmenitySchedules
                    SET Reserved = 1
                    WHERE ScheduleID = ?
                `;

                connection.query(updateQuery, [ScheduleID], (err, updateResults) => {
                    if (err) {
                        connection.rollback(() => {
                            connection.release();
                            console.error('Database update error:', err);
                            return res.json({ success: false, message: 'Database update error.' });
                        });
                        return;
                    }

                    // Commit the transaction
                    connection.commit(err => {
                        if (err) {
                            connection.rollback(() => {
                                connection.release();
                                console.error('Error committing transaction:', err);
                                return res.json({ success: false, message: 'Error committing transaction.' });
                            });
                            return;
                        }
                        
                        connection.release();
                        res.json({ success: true, message: 'Reservation added successfully.' });
                    });
                });
            });
        });
    });
});

router.get('/getReservations', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }
    const userID = req.session.userId;

    // SQL query to join Reservations with UserAccounts, AmenitySchedules, and Amenities
    const getReservationsQuery = `
        SELECT 
            R.UserID, R.ScheduleID, R.Status, R.ReservationID, 
            UA.FirstName, UA.LastName, UA.PhoneNumber, UA.Email,
            ASch.StartTime, ASch.EndTime, ASch.Date, ASch.AmenityID,
            A.AmenityName
        FROM Reservations R
        INNER JOIN UserAccounts UA ON R.UserID = UA.UserID
        INNER JOIN AmenitySchedules ASch ON R.ScheduleID = ASch.ScheduleID
        INNER JOIN Amenities A ON ASch.AmenityID = A.AmenityID
        WHERE R.Status = 'Confirmed'
        AND R.UserID = ?
    `;

    db.query(getReservationsQuery,[userID],(err, reservationResults) => {
        if (err) {
            console.error('Failed to retrieve reservations:', err);
            return res.status(500).json({ success: false, message: 'Failed to retrieve reservations.', error: err });
        }

        // If you get results, send them back to the client
        if (reservationResults.length > 0) {
            return res.json({ success: true, reservations: reservationResults });
        } else {
            return res.json({ success: false, message: 'No confirmed reservations found.' });
        }
    });
});





module.exports = router;
