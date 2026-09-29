// Netlify Function: RSVP Handler
// Deploy to: netlify/functions/rsvp.js
// Requires: npm install faunadb (or use JSON file storage)

const fs = require('fs');
const path = require('path');

const RSVP_FILE = path.join(__dirname, '../../data/rsvp.json');

// Ensure data directory exists
function ensureDataDir() {
    const dataDir = path.dirname(RSVP_FILE);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(RSVP_FILE)) {
        fs.writeFileSync(RSVP_FILE, JSON.stringify([], null, 2));
    }
}

// Read existing RSVPs
function readRSVPs() {
    ensureDataDir();
    try {
        const data = fs.readFileSync(RSVP_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Write RSVPs
function writeRSVPs(rsvps) {
    ensureDataDir();
    fs.writeFileSync(RSVP_FILE, JSON.stringify(rsvps, null, 2));
}

exports.handler = async (event, context) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method not allowed' })
        };
    }

    // Parse body
    let data;
    try {
        data = JSON.parse(event.body);
    } catch (err) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON' })
        };
    }

    // Validate required fields
    const required = ['name', 'email', 'guests', 'attendance'];
    for (const field of required) {
        if (!data[field]) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `Missing required field: ${field}` })
            };
        }
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid email format' })
        };
    }

    // Add metadata
    const rsvp = {
        id: Date.now().toString(),
        ...data,
        submittedAt: new Date().toISOString(),
        ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown'
    };

    // Read existing, add new, save
    const rsvps = readRSVPs();
    rsvps.push(rsvp);
    writeRSVPs(rsvps);

    // Return success
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: 'RSVP submitted successfully',
            id: rsvp.id
        })
    };
};