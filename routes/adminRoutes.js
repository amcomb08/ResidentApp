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

            const PAYMENT_AMOUNT = 1300;
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

                const apartmentQuery = `SELECT DISTINCT ApartmentNumber FROM UserAccounts WHERE ApartmentNumber IS NOT NULL`;
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
                        PAYMENT_AMOUNT,
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
                    
                                connection.query(updateBalanceQuery, [apartment.ApartmentNumber, PAYMENT_AMOUNT], (err, updateResults) => {
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

router.post('/submitEvent', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        EventName,
        EventDate,
        EventLocation,
        EventDescription
    } = req.body;

    // Construct the insert query
    const insertQuery = `
        INSERT INTO Events (
            EventName,
            EventDate,
            EventLocation,
            EventDescription
        ) VALUES (?, ?, ?, ?)
    `;
    
        // Execute the insert query
        db.query(insertQuery, [
            EventName,
            EventDate,
            EventLocation,
            EventDescription
        ], (err, results) => {
            if (err) {
                console.error('Database insert error:', err);
                return res.json({ success: false, message: 'Database insert error.' });
            }

            // Successfully inserted data
            return res.json({ success: true, message: 'User added successfully.' });
        });
});

router.post('/deleteEvent', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        EventID
    } = req.body;

    // Construct the delete query
    const deleteQuery = `
        DELETE FROM Events
        WHERE EventID = ?
    `;

        // Execute the insert query
        db.query(deleteQuery, [
            EventID
        ], (err, results) => {
            if (err) {
                console.error('Failed to delete event.', err);
                return res.json({ success: false, message: 'Failed to delete event.' });
            }

            if (results.affectedRows > 0) {
                res.json({ success: true, message: 'Event successfully deleted.' });
            } else {
                res.json({ success: false, message: 'No event found with that information.' });
            }
        });
});

router.post('/submitAnnouncement', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        AnnouncementHeader,
        AnnouncementDetail
    } = req.body;

    // Construct the insert query
    const insertQuery = `
        INSERT INTO Announcements (
            AnnouncementHeader,
            AnnouncementDetail
        ) VALUES (?, ?)
    `;
    
        // Execute the insert query
        db.query(insertQuery, [
            AnnouncementHeader,
            AnnouncementDetail
        ], (err, results) => {
            if (err) {
                console.error('Database insert error:', err);
                return res.json({ success: false, message: 'Database insert error.' });
            }

            // Successfully inserted data
            return res.json({ success: true, message: 'User added successfully.' });
        });
});

router.post('/deleteAnnouncement', (req, res) => {
    // Check if the user is logged in and has a session
    if (!req.session || !req.session.userId) {
        return res.json({ success: false, message: 'User is not logged in.' });
    }

    const {
        AnnouncementID
    } = req.body;

    // Construct the delete query
    const deleteQuery = `
        DELETE FROM Announcements
        WHERE AnnouncementID = ?
    `;

        // Execute the insert query
        db.query(deleteQuery, [
            AnnouncementID
        ], (err, results) => {
            if (err) {
                console.error('Failed to delete event.', err);
                return res.json({ success: false, message: 'Failed to delete event.' });
            }

            if (results.affectedRows > 0) {
                res.json({ success: true, message: 'Event successfully deleted.' });
            } else {
                res.json({ success: false, message: 'No event found with that information.' });
            }
        });
});

router.get('/getAmenities', (req, res) => {
    const userID = req.session.userId;
  
    if (!userID) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }
  
    const getAmenitiesQuery = 'SELECT AmenityID, AmenityName FROM Amenities';
  
    db.query(getAmenitiesQuery, [userID], (err, amenitiesResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.json({ success: false, message: 'Database error occurred.' });
        }
        if (amenitiesResults.length === 0) {
            return res.json({ success: false, message: 'No payment methods found.' });
        }
  
        // Sending the payment methods directly
        return res.json({ success: true, amenities: amenitiesResults });
    });
  });

    router.post('/submitAmenityHours', async (req, res) => {
        // Assuming req.body contains your dataToInsert object
        if (!req.session || !req.session.userId) {
            return res.json({ success: false, message: 'User is not logged in.' });
        }
        const {
            AmenityID,
            StartDate,
            EndDate,
            StartHour,
            EndHour,
            Interval,
            ClosedDays
        } = req.body;
    
        // Function to generate dates between start and end date
        const generateDates = (startDate, endDate) => {
            let dates = [];
            let currentDate = new Date(startDate);
        
            // Set the time to the end of the day for the endDate to make it inclusive
            let end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
        
            while (currentDate <= end) {
                // Format the date to 'YYYY-MM-DD' and check if it's not a closed day
                const dayOfWeek = currentDate.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long' });
                if (!ClosedDays.includes(dayOfWeek)) {
                    dates.push(new Date(currentDate));
                }
                // Increment the date by 1 day
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        
            // Convert dates to ISO strings for consistency and debugging
            return dates.map((date) => date.toISOString());
        };
              
    
        // Function to calculate time slots for a given date
        const generateTimeSlots = (date, startHour, endHour, interval) => {
            let timeSlots = [];
            // Ensure date is in ISO format (YYYY-MM-DD)
            let startDate = new Date(date);
            let startTime = new Date(startDate.setHours(parseInt(startHour.split(':')[0]), parseInt(startHour.split(':')[1])));
            let endTime = new Date(startDate.setHours(parseInt(endHour.split(':')[0]), parseInt(endHour.split(':')[1])));
        
            // Calculate interval in milliseconds
            let intervalHours = parseInt(interval.split(':')[0]);
            let intervalMinutes = parseInt(interval.split(':')[1]);
            let intervalMilliseconds = (intervalHours * 60 * 60 * 1000) + (intervalMinutes * 60 * 1000);
        
            while (startTime < endTime) {
                // Define the end of the current slot
                let slotEnd = new Date(startTime.getTime() + intervalMilliseconds);
                
                // Ensure the slot does not exceed the daily end hour
                if (slotEnd > endTime) {
                    slotEnd = endTime;
                }
        
                // Save the time slot if it's within the day's hours
                if (slotEnd <= endTime) {
                    timeSlots.push({
                        start: startTime.toTimeString().split(' ')[0], // Format to "HH:MM:SS"
                        end: slotEnd.toTimeString().split(' ')[0],   // Format to "HH:MM:SS"
                        date: date // Already in "YYYY-MM-DD" format
                    });
                }
        
                // Move to the next slot
                startTime = slotEnd;
            }
        
            return timeSlots;
        };         

        try {
            // Get the list of valid dates, excluding closed days
            let validDates = generateDates(StartDate, EndDate);
            console.log('Valid dates:', validDates);
            // Generate the schedule slots for each valid date
            for (let date of validDates) {
                console.log('Generating slots for', date);
                let slots = generateTimeSlots(date, StartHour, EndHour, Interval);
                console.log('Slots for', date, ':', slots);
                // Insert slots into the AmenitySchedules table
                for (let slot of slots) {
                    const insertQuery = `
                        INSERT INTO AmenitySchedules (AmenityID, StartTime, EndTime, Date, Reserved)
                        VALUES (?, ?, ?, ?, 0)
                    `;
                    let formattedDate = slot.date.split('T')[0];
        
                    // Here we assume `db` is your database connection object
                    db.query(insertQuery, [AmenityID, slot.start, slot.end, formattedDate]);
                }
            }
        
            res.json({ success: true, message: 'Schedule created successfully.' });
        
        } catch (error) {
            console.error('Error creating schedule:', error);
            res.status(500).json({ success: false, message: 'Failed to create schedule.', error: error.message });
        }
    });


    router.post('/submitAmenity', (req, res) => {
        // Check if the user is logged in and has a session
        if (!req.session || !req.session.userId) {
            return res.json({ success: false, message: 'User is not logged in.' });
        }
    
        const {
            AmenityName,
            AmenityDescription
        } = req.body;
    
        // Construct the insert query
        const insertQuery = `
            INSERT INTO Amenities (
                AmenityName,
                Description
            ) VALUES (?, ?)
        `;
        
            // Execute the insert query
            db.query(insertQuery, [
                AmenityName,
                AmenityDescription
            ], (err, results) => {
                if (err) {
                    console.error('Database insert error:', err);
                    return res.json({ success: false, message: 'Database insert error.' });
                }
    
                // Successfully inserted data
                return res.json({ success: true, message: 'User added successfully.' });
            });
    });

    router.get('/get-reservations', (req, res) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
    
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
        `;
    
        db.query(getReservationsQuery, (err, reservationResults) => {
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
    
    router.post('/cancelReservation', (req, res) => {
        if (!req.session || !req.session.userId) {
            return res.json({ success: false, message: 'User is not logged in.' });
        }

        const { ReservationID, ScheduleID } = req.body;

        // Get a connection from the pool
        db.getConnection((err, connection) => {
            if (err) {
                return res.json({ success: false, message: 'Error getting database connection.' });
            }

            // Start a transaction
            connection.beginTransaction((err) => {
                if (err) {
                    return res.json({ success: false, message: 'Failed to start the transaction.' });
                }

                // Construct the query to update the reservation status
                const cancelQuery = `
                    UPDATE Reservations
                    SET Status = 'Cancelled'
                    WHERE ReservationID = ?
                `;

                // Execute the query to update the reservation status
                connection.query(cancelQuery, [ReservationID], (err, results) => {
                    if (err) {
                        connection.rollback(() => {
                            console.error('Failed to cancel reservation.', err);
                            return res.json({ success: false, message: 'Failed to cancel reservation.' });
                        });
                        return;
                    }

                    if (results.affectedRows === 0) {
                        connection.rollback(() => {
                            return res.json({ success: false, message: 'No reservation found with that information.' });
                        });
                        return;
                    }

                    // Construct the query to update the amenity schedule
                    const updateScheduleQuery = `
                        UPDATE AmenitySchedules
                        SET Reserved = 0
                        WHERE ScheduleID = ?
                    `;

                    // Execute the query to update the amenity schedule
                    connection.query(updateScheduleQuery, [ScheduleID], (err, updateResults) => {
                        if (err) {
                            connection.rollback(() => {
                                console.error('Failed to update amenity schedule.', err);
                                return res.json({ success: false, message: 'Failed to update amenity schedule.' });
                            });
                            return;
                        }

                        // Commit the transaction
                        connection.commit((err) => {
                            if (err) {
                                connection.rollback(() => {
                                    console.error('Failed to commit transaction.', err);
                                    return res.json({ success: false, message: 'Failed to commit the changes.' });
                                });
                                return;
                            }

                            res.json({ success: true, message: 'Reservation successfully canceled and schedule updated.' });
                        });
                    });
                });
            });
        });
    });
    
    

module.exports = router;