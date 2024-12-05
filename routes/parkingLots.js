const express = require('express');
const ParkingLot = require('../models/ParkingLot');
const { MongoClient, ObjectId } = require('mongodb');
const router = express.Router();

const URI = process.env.URI;
const DATABASE_NAME = 'parkingDB';
const COLLECTION_NAME = 'parkingData';
const client = new MongoClient(URI);

// Route to fetch all parking lots
router.get('/api/parking-data', async (req, res) => {
    try {
        const parkingLots = await ParkingLot.find();
        res.json(parkingLots);
    } catch (err) {
        res.status(500).json({ message: "Error fetching parking lots", error: err });
    }
});

// Route to add a parking lot
router.post('/parking-data', async (req, res) => {
    const newParkingLot = req.body;

    try {
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

        const result = await collection.insertOne(newParkingLot);
        // Send the inserted document or its ID as a response
        res.status(201).json({
            insertedId: result.insertedId,
            message: "Parking lot added successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to add parking lot');
    } finally {
        await client.close();
    }
});

// Route to delete a parking lot
router.delete('/parking-data/:id', async (req, res) => {
    const id = req.params.id;

    try {
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
    } finally {
        await client.close();
    }
});

module.exports = router;