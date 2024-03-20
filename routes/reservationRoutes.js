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

    const getScheduleQuery = 'SELECT ScheduleID, Date, StartTime, EndTime FROM AmenitySchedules WHERE AmenityID = ?';

    db.query(getScheduleQuery, [amenityId], (err, schedules) => {
        if (err) {
            return res.json({ success: false, message: 'Failed to retrieve schedules.' });
        }

        return res.json({ success: true, schedules });
    });
});




module.exports = router;
