const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Initialize Database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                profession TEXT NOT NULL,
                reg_body TEXT,
                reg_num TEXT,
                linkedin TEXT,
                goals TEXT,
                amount REAL NOT NULL,
                reference TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating enrollments table', err.message);
            } else {
                console.log('Enrollments table ready.');
            }
        });
    }
});

// Paystack Configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const isMockMode = !PAYSTACK_SECRET_KEY;

if (isMockMode) {
    console.warn('WARNING: PAYSTACK_SECRET_KEY is not defined in env. Running in Sandbox Mock Mode.');
}

/**
 * Helper to generate unique transaction reference
 */
function generateReference() {
    return 'RMJ-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
}

/**
 * 1. Initialize Payment Endpoint
 * POST /api/payment/initialize
 */
app.post('/api/payment/initialize', async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        profession,
        reg_body,
        reg_num,
        linkedin,
        goals,
        amount
    } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !profession || !amount) {
        return res.status(400).json({
            status: false,
            message: 'Validation failed: first_name, last_name, email, profession and amount are required.'
        });
    }

    const reference = generateReference();
    const cleanAmount = parseFloat(amount) || 27;

    // Store pending enrollment in SQLite
    const query = `
        INSERT INTO enrollments (
            first_name, last_name, email, phone, profession, reg_body, reg_num, linkedin, goals, amount, reference, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.run(query, [
        first_name,
        last_name,
        email,
        phone || null,
        profession,
        reg_body || 'none',
        reg_num || null,
        linkedin || null,
        goals || null,
        cleanAmount,
        reference
    ], async function (err) {
        if (err) {
            console.error('Database Error inserting enrollment', err.message);
            return res.status(500).json({
                status: false,
                message: 'Failed to record enrollment application.'
            });
        }

        // Host determination for callback URL redirection
        const host = req.get('host');
        const protocol = req.secure ? 'https' : 'http';
        const callback_url = `${protocol}://${host}/api/payment/verify`;

        if (isMockMode) {
            // Mock Redirect URL for sandbox testing
            const mock_authorization_url = `${protocol}://${host}/api/payment/verify?reference=${reference}`;
            return res.status(200).json({
                status: true,
                message: 'Mock Authorization URL created successfully',
                data: {
                    authorization_url: mock_authorization_url,
                    access_code: 'MOCK_ACCESS_CODE_' + reference,
                    reference: reference
                }
            });
        }

        try {
            // Live/Sandbox Paystack Call
            const paystackResponse = await axios.post(
                'https://api.paystack.co/transaction/initialize',
                {
                    email: email,
                    amount: Math.round(cleanAmount * 100), // convert to cents
                    currency: 'USD',
                    reference: reference,
                    callback_url: callback_url,
                    metadata: {
                        first_name,
                        last_name,
                        profession,
                        phone
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (paystackResponse.data && paystackResponse.data.status) {
                return res.status(200).json(paystackResponse.data);
            } else {
                throw new Error(paystackResponse.data.message || 'Invalid response from Paystack.');
            }
        } catch (paystackError) {
            console.error('Paystack initialization error:', paystackError.response?.data || paystackError.message);
            return res.status(502).json({
                status: false,
                message: 'Paystack checkout service returned an error. Please verify your API keys or configuration.',
                error: paystackError.response?.data || paystackError.message
            });
        }
    });
});

/**
 * 2. Verify Payment Redirect Endpoint
 * GET /api/payment/verify
 */
app.get('/api/payment/verify', async (req, res) => {
    const { reference, trxref } = req.query;
    const ref = reference || trxref;

    if (!ref) {
        return res.status(400).send('<h1>Error</h1><p>Missing transaction reference code.</p>');
    }

    // Retrieve database entry
    db.get('SELECT * FROM enrollments WHERE reference = ?', [ref], async (err, enrollment) => {
        if (err || !enrollment) {
            console.error('Enrollment record lookup failed for', ref, err?.message);
            return res.status(404).send('<h1>Not Found</h1><p>Application reference not found.</p>');
        }

        if (enrollment.status === 'completed') {
            // Already completed, redirect straight to success
            return res.redirect(`/success.html?reference=${ref}&first_name=${encodeURIComponent(enrollment.first_name)}&email=${encodeURIComponent(enrollment.email)}&amount=${enrollment.amount}`);
        }

        let isSuccessful = false;

        if (isMockMode) {
            isSuccessful = true;
        } else {
            try {
                // Query Paystack verify endpoint
                const verifyResponse = await axios.get(
                    `https://api.paystack.co/transaction/verify/${ref}`,
                    {
                        headers: {
                            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
                        }
                    }
                );

                if (verifyResponse.data && verifyResponse.data.status && verifyResponse.data.data.status === 'success') {
                    isSuccessful = true;
                }
            } catch (verifyError) {
                console.error('Paystack verification api error:', verifyError.response?.data || verifyError.message);
            }
        }

        if (isSuccessful) {
            // Update enrollment status to completed
            db.run(
                'UPDATE enrollments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE reference = ?',
                ['completed', ref],
                (updateErr) => {
                    if (updateErr) {
                        console.error('Database update failed for reference', ref, updateErr.message);
                    }
                    // Redirect candidate to success.html
                    return res.redirect(`/success.html?reference=${ref}&first_name=${encodeURIComponent(enrollment.first_name)}&email=${encodeURIComponent(enrollment.email)}&amount=${enrollment.amount}`);
                }
            );
        } else {
            // Payment failed or is unverified
            db.run('UPDATE enrollments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE reference = ?', ['failed', ref]);
            return res.redirect(`/success.html?failed=true&reference=${ref}&first_name=${encodeURIComponent(enrollment.first_name)}`);
        }
    });
});

/**
 * 3. Paystack Asynchronous Webhook Endpoint
 * POST /api/payment/webhook
 */
app.post('/api/payment/webhook', (req, res) => {
    // Paystack delivers webhooks asynchronously to ensure reliability
    const event = req.body;

    if (!event || !event.event) {
        return res.sendStatus(400);
    }

    console.log(`Received Paystack Webhook Event: ${event.event}`);

    if (event.event === 'charge.success') {
        const data = event.data;
        const reference = data.reference;

        db.get('SELECT * FROM enrollments WHERE reference = ?', [reference], (err, enrollment) => {
            if (err) {
                console.error('Webhook: db search failed', err.message);
                return res.sendStatus(500);
            }

            if (!enrollment) {
                console.log(`Webhook: reference ${reference} not found in database.`);
                return res.sendStatus(200); // return 200 to acknowledge Paystack receipt
            }

            if (enrollment.status !== 'completed') {
                db.run(
                    'UPDATE enrollments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE reference = ?',
                    ['completed', reference],
                    (updateErr) => {
                        if (updateErr) {
                            console.error('Webhook: DB update status failed', updateErr.message);
                            return res.sendStatus(500);
                        } else {
                            console.log(`Webhook: successfully completed enrollment status for ${reference}`);
                            return res.sendStatus(200);
                        }
                    }
                );
            } else {
                console.log(`Webhook: reference ${reference} was already completed.`);
                return res.sendStatus(200);
            }
        });
    } else {
        // Acknowledge other webhook events
        return res.sendStatus(200);
    }
});

// Serve specific route fallback middleware
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`RemoteMedicalJobs Node.js Server listening on port ${PORT}`);
    console.log(`Mock Mode: ${isMockMode ? 'ACTIVE (No API Keys required)' : 'INACTIVE (Live Paystack Integration active)'}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`=================================================`);
});

module.exports = app; // export for testing
