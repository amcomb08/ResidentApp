const mysql = require('mysql2');

// Database connection pool setup
const dbHost = process.env.DB_HOST || 'localhost';
const db = mysql.createPool({
    host: dbHost,
    user: 'root',
    password: 'CULTUREAPP',
    database: 'ResidentAppDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;