const axios = require('axios'); // For HTTP requests
const cheerio = require('cheerio'); // For parsing HTML
const { MongoClient } = require('mongodb'); // For MongoDB
const dotenv = require('dotenv');

// MongoDB Configuration
dotenv.config();  // Setup dotenv file. Source: https://www.youtube.com/watch?v=-NfsmF-6BHo
const URI = process.env.URI;
const DATABASE_NAME = "parkingDB";
const COLLECTION_NAME = "parkingData";

// LSU Parking Page URL
const LSU_PARKING_URL = "https://www.lsu.edu/parking/availability.php";

// Time slots in the order they appear in the table
const TIME_SLOTS = ["7:00 am", "11:00 am", "2:00 pm", "4:00 pm"];

// Scrape and Store Parking Data
async function scrapeAndStoreParkingData() {
    try {
        // Fetch HTML from the LSU Parking page
        const { data: html } = await axios.get(LSU_PARKING_URL);
        const $ = cheerio.load(html);

        // Locate buttons controlling day-specific collapsible tables
        const dayButtons = $('button[data-toggle="collapse"]');

        const parkingData = [];

        dayButtons.each((index, buttonElement) => {
            const day = $(buttonElement).text().trim();
            const tableSelector = $(buttonElement).attr('data-target');
            const table = $(tableSelector);

            if (table.length > 0) {
                const rows = table.find('tbody tr');

                rows.each((rowIndex, rowElement) => {
                    const cells = $(rowElement).find('td');

                    if (cells.length > 0) {
                        const lotName = $(cells[0]).text().trim();
                        const lotNumber = parseInt($(cells[1]).text().trim(), 10);
                        const totalSpaces = parseInt($(cells[2]).text().trim(), 10);

                        // Extract availability percentages for all time slots
                        const availability = TIME_SLOTS.reduce((acc, time, index) => {
                            const timeSlotAvailability = parseAvailability($(cells[3 + index]).text());
                            acc[time] = timeSlotAvailability;
                            return acc;
                        }, {});

                        parkingData.push({
                            lotName,
                            lotNumber,
                            totalSpaces,
                            day,
                            availability,
                        });
                    }
                });
            }
        });

        console.log("Scraped Parking Data:", parkingData);

        // Insert data into MongoDB
        const client = new MongoClient(URI);
        await client.connect();
        const db = client.db(DATABASE_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Clear existing collection and insert new data
        await collection.deleteMany({});
        await collection.insertMany(parkingData);

        console.log("Parking data successfully saved to MongoDB!");

        await client.close();
    } catch (error) {
        console.error("Error scraping or storing parking data:", error);
    }
}

// Helper Function to Parse Availability Percentages
function parseAvailability(text) {
    const percentage = parseInt(text.replace('%', '').trim(), 10);
    return isNaN(percentage) ? 0 : percentage;
}

// Export the script
module.exports = { scrapeAndStoreParkingData };
