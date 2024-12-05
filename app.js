const express = require("express");
const mongoose = require("mongoose");
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const scraper = require('./scraper');
const router = express.Router();
const parkingLotRoutes = require("./routes/parkingLots");
// Use CORS for AWS
const cors = require('cors');

// MongoDB Configuration
// Setup dotenv file. Source: https://www.youtube.com/watch?v=-NfsmF-6BHo
dotenv.config();
const URI = process.env.URI;
const PORT = process.env.PORT;
const DATABASE_NAME = 'parkingDB';
const COLLECTION_NAME = 'parkingData';

// Initialize the app
const app = express();

// Middleware
app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api", parkingLotRoutes);

// MongoDB Connection. Source: MongoDB setup documentation
mongoose.connect(URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

// Route for scraping parking data
app.get('/scrape-parking-data', async (req, res) => {
    try {
        await scraper.scrapeAndStoreParkingData(); // Call the scraping function
        res.send('Parking data scraped and saved successfully!');
    } catch (error) {
        res.status(500).send('Error scraping parking data.');
    }
});

// Route for fetching parking data from the database
app.get('/api/parking-data', async (req, res) => {
    try {
        const client = new MongoClient(URI);
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);
        const data = await collection.find({}).toArray();
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching parking data.');
    }
});

// Add a new parking lot
router.post('/api/parking-data', async (req, res) => {
    try {
        const newLot = req.body;

        // Connect to MongoDB
        const client = new MongoClient(URI);
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Insert the new parking lot into the database
        const result = await collection.insertOne(newLot);

        // Send the inserted parking lot back as a response
        res.status(201).json(result.ops[0]);
    } catch (error) {
        console.error('Error saving new parking lot:', error);
        res.status(500).send('Failed to save the new parking lot.');
    }
});

// Delete a parking lot by ID
router.delete('/api/parking-data/:id', async (req, res) => {
    try {
        const { id } = req.params;  // Get the ID from the URL parameter

        // Connect to MongoDB
        const client = new MongoClient(URI);
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const objectId = new ObjectId(id);
        const result = await collection.deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Parking lot not found' });
        }

        res.status(200).json({ message: 'Parking lot deleted successfully' });
    } catch (error) {
        console.error('Error deleting parking lot:', error);
        res.status(500).send('Failed to delete the parking lot.');
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://18.224.86.173:${PORT}`);
});

module.exports = router;