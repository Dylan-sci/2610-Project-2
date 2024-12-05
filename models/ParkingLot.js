const mongoose = require("mongoose");

// Use Mongoose to managae database easier. Source: https://www.mongodb.com/developer/languages/javascript/getting-started-with-mongodb-and-mongoose/
// Parking Lot Schema
const parkingLotSchema = new mongoose.Schema({
    lotName: {
        type: String,
        required: true
    },
    lotNumber: {
        type: Number,
        required: true
    },
    totalSpaces: {
        type: Number,
        required: true
    },
    day: {
        type: String,
        required: true
    },
    availability: {
        type: [Number],
        required: true
    }
});

const ParkingLot = mongoose.model("ParkingLot", parkingLotSchema);
module.exports = ParkingLot;