const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const sslCertificatePath = path.join(__dirname, 'certs', 'DigiCertGlobalRootCA.crt.pem');
const sslCertificate = fs.readFileSync(sslCertificatePath);
require('dotenv').config();

// Database connection pool setup
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

const db = mysql.createPool({
    host: dbHost,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        ca: sslCertificate
    }
});

module.exports = db;