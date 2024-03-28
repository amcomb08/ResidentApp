const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const sslCertificatePath = path.join(__dirname, 'certs', 'DigiCertGlobalRootCA.crt.pem');
const sslCertificate = fs.readFileSync(sslCertificatePath);

// Database connection pool setup
const dbHost = process.env.DB_HOST || 'localhost';

const db = mysql.createPool({
    host: 'residentapplication-server.mysql.database.azure.com',
    user: 'wmcdzvktoy',
    password: 'CSE696ResidentApp',
    database: 'residentapplication-database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        ca: sslCertificate
    }
});

module.exports = db;