const express = require('express');
const router = express.Router();
const db = require('./db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const crypto = require('crypto');

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

    router.get('/getReservations', (req, res) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
    
        // SQL query to join Reservations with UserAccounts, AmenitySchedules, and Amenities
        // and check that ASch.Date is today or in the future
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
            AND ASch.Date >= CURDATE()
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

    router.get('/getApartments', (req, res) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }
    
        // SQL query to fetch all apartments with the names and the current total amount due
        // where an ApartmentNumber is assigned. If there is no balance, it defaults to 0.
        const getApartmentsQuery = `
                SELECT 
                A.ApartmentNumber,
                GROUP_CONCAT(DISTINCT UA.FirstName, ' ', UA.LastName SEPARATOR ', ') AS Names,
                GROUP_CONCAT(DISTINCT UA.Email SEPARATOR ', ') AS Emails,
                COALESCE(AB.TotalAmountDue, 0) AS TotalAmountDue,
                A.LeaseEndDate  -- Assuming LeaseEndDate is a column in the Apartments table
            FROM Apartments A
            INNER JOIN UserAccounts UA ON A.ApartmentNumber = UA.ApartmentNumber
            LEFT JOIN ApartmentBalances AB ON A.ApartmentNumber = AB.ApartmentNumber
            WHERE UA.ApartmentNumber IS NOT NULL AND UA.ApartmentNumber != ''
            GROUP BY A.ApartmentNumber, A.LeaseEndDate
            ORDER BY A.ApartmentNumber;
        `;
    
        db.query(getApartmentsQuery, (err, apartmentsResults) => {
            if (err) {
                console.error('Failed to retrieve apartments:', err);
                return res.status(500).json({ success: false, message: 'Failed to retrieve apartments.', error: err });
            }
    
            if (apartmentsResults.length > 0) {
                return res.json({ success: true, apartments: apartmentsResults });
            } else {
                return res.json({ success: false, message: 'No apartments found.' });
            }
        });
    });
    
    
    

module.exports = router;