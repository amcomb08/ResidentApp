const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const upload = multer({ storage: multer.memoryStorage() });
require('dotenv').config();


router.post('/upload-document', upload.single('filephoto'), async (req, res) => {
    console.log('Upload Document Endpoint Hit');
    console.log('Session User ID:', req.session.userId);

    const file = req.file;

    if (!file) {
        console.log('No file uploaded.');
        return res.status(400).send('No file uploaded.');
    }

    const sasToken = process.env.SAS_TOKEN;
    const blobServiceClient = new BlobServiceClient(
        `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net/?${sasToken}`
    );

    const containerName = 'user-documents';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = `${req.session.userId}/${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    console.log(`Attempting to upload: ${blobName}`);

    try {
        // Upload file to Azure Blob Storage
        const uploadBlobResponse = await blockBlobClient.upload(file.buffer, file.size);

        // Database operation
        const query = 'INSERT INTO UserDocuments (userId, blobName, blobUrl) VALUES (?, ?, ?)';

        db.query(query, [req.session.userId, blobName, blockBlobClient.url], (dbErr, dbRes) => {
            if (dbErr) {
                console.error('Database error:', dbErr);
                return res.status(500).send('Database error.');
            }

            console.log('Database query successful', dbRes);
            res.status(200).send({ success: true, message: 'File uploaded successfully', blobUrl: blockBlobClient.url });
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).send('Error uploading file.');
    }
});


// This should be a GET request handler in one of your route files
router.get('/user-documents', async (req, res) => {
    const userId = req.session.userId;
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient('user-documents');

    const userFolder = `${userId}/`;
    let blobs = [];

    // Iterate over all blobs in the container and collect those under user's folder
    for await (const blob of containerClient.listBlobsFlat({ prefix: userFolder })) {
        blobs.push({
            name: blob.name.replace(userFolder, ''), // Removing the folder prefix
            url: `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net/user-documents/${blob.name}`
        });
    }

    res.json(blobs); // Send back the list of blobs
});


module.exports = router;