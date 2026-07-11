const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const {
    sendMail,
    courseEmailHtml,
    contactNotifyHtml,
    contactAutoReplyHtml
} = require('./lib/email');
const {
    getProduct,
    getAllProducts,
    getModules,
    getBonuses
} = require('./lib/course-content');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

// Behind reverse proxies (nginx, Cloudflare, Render, etc.)
app.set('trust proxy', 1);

// ---------- Security / middleware ----------
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, cb) {
            // Allow same-origin / curl / server-to-server
            if (!origin) return cb(null, true);
            if (allowedOrigins.length === 0) return cb(null, true); // dev-friendly default
            if (allowedOrigins.includes(origin)) return cb(null, true);
            return cb(new Error('Not allowed by CORS'));
        }
    })
);

// Capture raw body for Paystack webhook signature verification
app.use(
    express.json({
        verify: (req, res, buf) => {
            if (req.originalUrl === '/api/payment/webhook') {
                req.rawBody = buf;
            }
        }
    })
);
app.use(express.urlencoded({ extended: true }));

// Lightweight rate limit (in-memory)
const rateBuckets = new Map();
function rateLimit(key, limit, windowMs) {
    const now = Date.now();
    let bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
        bucket = { count: 0, resetAt: now + windowMs };
        rateBuckets.set(key, bucket);
    }
    bucket.count += 1;
    return bucket.count <= limit;
}

// Static frontend
app.use(express.static(__dirname, { index: false }));

// ---------- Database ----------
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initSchema();
    }
});

function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function initSchema() {
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                profession TEXT NOT NULL,
                country TEXT,
                experience TEXT,
                job_title TEXT,
                product_id TEXT DEFAULT 'standard',
                reg_body TEXT,
                reg_num TEXT,
                linkedin TEXT,
                goals TEXT,
                amount REAL NOT NULL,
                reference TEXT UNIQUE NOT NULL,
                access_token TEXT UNIQUE,
                email_sent INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                utm_source TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migrate older DBs: add columns if missing
        const alters = [
            'ALTER TABLE enrollments ADD COLUMN country TEXT',
            'ALTER TABLE enrollments ADD COLUMN experience TEXT',
            'ALTER TABLE enrollments ADD COLUMN job_title TEXT',
            'ALTER TABLE enrollments ADD COLUMN product_id TEXT DEFAULT \'standard\'',
            'ALTER TABLE enrollments ADD COLUMN access_token TEXT',
            'ALTER TABLE enrollments ADD COLUMN email_sent INTEGER DEFAULT 0',
            'ALTER TABLE enrollments ADD COLUMN utm_source TEXT'
        ];
        alters.forEach((sql) => {
            db.run(sql, () => {});
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                inquiry_type TEXT,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                country TEXT,
                experience TEXT,
                profession TEXT,
                job_title TEXT,
                goals TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database schema ready.');
    });
}

// ---------- Paystack / products ----------
const PAYSTACK_SECRET_KEY = (process.env.PAYSTACK_SECRET_KEY || '').trim();
const isMockMode =
    process.env.FORCE_MOCK_PAYMENTS === 'true' ||
    !PAYSTACK_SECRET_KEY ||
    /your_actual_key|changeme|xxx/i.test(PAYSTACK_SECRET_KEY);

if (isMockMode) {
    if (NODE_ENV === 'production') {
        console.error('FATAL: PAYSTACK_SECRET_KEY required in production. Refusing mock payments.');
    } else {
        console.warn(
            process.env.FORCE_MOCK_PAYMENTS === 'true'
                ? 'Mock payments forced (FORCE_MOCK_PAYMENTS=true).'
                : 'WARNING: PAYSTACK_SECRET_KEY not set. Sandbox Mock Mode ACTIVE (dev only).'
        );
    }
}

function generateReference() {
    return 'RMJ-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
}

function generateAccessToken() {
    return crypto.randomBytes(24).toString('hex');
}

function getBaseUrl(req) {
    if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;
    const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    return `${proto}://${req.get('host')}`;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
}

function verifyPaystackSignature(rawBody, signature) {
    if (!PAYSTACK_SECRET_KEY || !signature || !rawBody) return false;
    const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(rawBody)
        .digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(String(signature)));
    } catch {
        return false;
    }
}

/**
 * Complete enrollment: mark paid, create access token, email course link.
 */
async function fulfillEnrollment(enrollment, baseUrl) {
    if (!enrollment) return null;

    let accessToken = enrollment.access_token;
    if (!accessToken) {
        accessToken = generateAccessToken();
        await runAsync(
            'UPDATE enrollments SET access_token = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [accessToken, 'completed', enrollment.id]
        );
    } else if (enrollment.status !== 'completed') {
        await runAsync(
            'UPDATE enrollments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['completed', enrollment.id]
        );
    }

    const fresh = await getAsync('SELECT * FROM enrollments WHERE id = ?', [enrollment.id]);
    const product = getProduct(fresh.product_id);
    const accessUrl = `${baseUrl}/course-access.html?token=${fresh.access_token}`;

    if (!fresh.email_sent) {
        const html = courseEmailHtml({
            firstName: fresh.first_name,
            productName: product.name,
            amount: fresh.amount,
            reference: fresh.reference,
            accessUrl,
            modules: getModules().map((m) => ({ title: m.title, duration: m.duration }))
        });

        const result = await sendMail({
            to: fresh.email,
            subject: `Your course access — ${product.name}`,
            html
        });

        if (result.success || result.mode === 'outbox') {
            await runAsync(
                'UPDATE enrollments SET email_sent = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [fresh.id]
            );
            fresh.email_sent = 1;
        }
    }

    return { enrollment: fresh, accessUrl, product };
}

// ---------- Health ----------
app.get('/api/health', async (req, res) => {
    try {
        await getAsync('SELECT 1 AS ok');
        res.json({
            status: true,
            env: NODE_ENV,
            mockMode: isMockMode,
            time: new Date().toISOString()
        });
    } catch (e) {
        res.status(500).json({ status: false, message: 'DB unavailable' });
    }
});

// ---------- Products ----------
app.get('/api/products', (req, res) => {
    res.json({ status: true, data: getAllProducts() });
});

// ---------- Free job interest / lead capture (no payment) ----------
app.post('/api/applications', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (!rateLimit(`app:${ip}`, 20, 60 * 60 * 1000)) {
        return res.status(429).json({ status: false, message: 'Too many submissions. Please try again later.' });
    }

    const {
        first_name,
        last_name,
        email,
        phone,
        country,
        experience,
        profession,
        job_title,
        goals
    } = req.body || {};

    if (!first_name || !last_name || !email || !profession) {
        return res.status(400).json({
            status: false,
            message: 'first_name, last_name, email and profession are required.'
        });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ status: false, message: 'Valid email is required.' });
    }

    try {
        const result = await runAsync(
            `INSERT INTO applications
            (first_name, last_name, email, phone, country, experience, profession, job_title, goals)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                String(first_name).trim(),
                String(last_name).trim(),
                String(email).trim().toLowerCase(),
                phone || null,
                country || null,
                experience || null,
                profession,
                job_title || null,
                goals || null
            ]
        );
        res.status(201).json({
            status: true,
            message: 'Application received. We will match you with suitable remote roles.',
            data: { id: result.lastID }
        });
    } catch (err) {
        console.error('Application insert error', err.message);
        res.status(500).json({ status: false, message: 'Failed to save application.' });
    }
});

// ---------- Contact ----------
app.post('/api/contact', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (!rateLimit(`contact:${ip}`, 10, 60 * 60 * 1000)) {
        return res.status(429).json({ status: false, message: 'Too many messages. Please try again later.' });
    }

    const { first_name, last_name, email, inquiry_type, message } = req.body || {};
    if (!first_name || !last_name || !email || !message) {
        return res.status(400).json({
            status: false,
            message: 'first_name, last_name, email and message are required.'
        });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ status: false, message: 'Valid email is required.' });
    }

    try {
        await runAsync(
            `INSERT INTO contacts (first_name, last_name, email, inquiry_type, message)
             VALUES (?, ?, ?, ?, ?)`,
            [
                String(first_name).trim(),
                String(last_name).trim(),
                String(email).trim().toLowerCase(),
                inquiry_type || 'other',
                String(message).trim()
            ]
        );

        const notifyTo = process.env.CONTACT_NOTIFY_EMAIL || process.env.SMTP_USER;
        if (notifyTo) {
            await sendMail({
                to: notifyTo,
                subject: `[Contact] ${inquiry_type || 'inquiry'} from ${first_name} ${last_name}`,
                html: contactNotifyHtml({
                    firstName: first_name,
                    lastName: last_name,
                    email,
                    inquiryType: inquiry_type || 'other',
                    message
                })
            });
        }

        await sendMail({
            to: email,
            subject: 'We received your message — RemoteMedicalJobs',
            html: contactAutoReplyHtml({ firstName: first_name })
        });

        res.status(201).json({
            status: true,
            message: 'Message received. We will reply within 1 business day.'
        });
    } catch (err) {
        console.error('Contact error', err.message);
        res.status(500).json({ status: false, message: 'Failed to send message.' });
    }
});

/**
 * POST /api/payment/initialize
 * Amount is ALWAYS server-side from product_id.
 */
app.post('/api/payment/initialize', async (req, res) => {
    if (isMockMode && NODE_ENV === 'production') {
        return res.status(503).json({
            status: false,
            message: 'Payments are temporarily unavailable. Please try again later.'
        });
    }

    const ip = req.ip || 'unknown';
    if (!rateLimit(`pay:${ip}`, 30, 60 * 60 * 1000)) {
        return res.status(429).json({ status: false, message: 'Too many checkout attempts. Please wait.' });
    }

    const {
        first_name,
        last_name,
        email,
        phone,
        profession,
        country,
        experience,
        job_title,
        product_id,
        reg_body,
        reg_num,
        linkedin,
        goals,
        utm_source
    } = req.body || {};

    if (!first_name || !last_name || !email || !profession) {
        return res.status(400).json({
            status: false,
            message: 'Validation failed: first_name, last_name, email and profession are required.'
        });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ status: false, message: 'Valid email is required.' });
    }

    const product = getProduct(product_id);
    const amount = product.amount; // ignore client amount
    const reference = generateReference();
    const baseUrl = getBaseUrl(req);
    const callback_url = `${baseUrl}/api/payment/verify`;

    try {
        await runAsync(
            `INSERT INTO enrollments (
                first_name, last_name, email, phone, profession, country, experience, job_title,
                product_id, reg_body, reg_num, linkedin, goals, amount, reference, status, utm_source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [
                String(first_name).trim(),
                String(last_name).trim(),
                String(email).trim().toLowerCase(),
                phone || null,
                profession,
                country || null,
                experience || null,
                job_title || null,
                product.id,
                reg_body || null,
                reg_num || null,
                linkedin || null,
                goals || null,
                amount,
                reference,
                utm_source || null
            ]
        );

        if (isMockMode) {
            return res.status(200).json({
                status: true,
                message: 'Mock Authorization URL created successfully',
                data: {
                    authorization_url: `${callback_url}?reference=${reference}`,
                    access_code: 'MOCK_ACCESS_CODE_' + reference,
                    reference,
                    amount,
                    product_id: product.id
                }
            });
        }

        const paystackResponse = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: String(email).trim().toLowerCase(),
                amount: Math.round(amount * 100),
                currency: process.env.PAYSTACK_CURRENCY || 'USD',
                reference,
                callback_url,
                metadata: {
                    first_name,
                    last_name,
                    profession,
                    phone,
                    product_id: product.id,
                    country
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
            return res.status(200).json({
                ...paystackResponse.data,
                data: {
                    ...paystackResponse.data.data,
                    amount,
                    product_id: product.id
                }
            });
        }
        throw new Error('Invalid response from Paystack.');
    } catch (err) {
        console.error('Payment initialize error:', err.response?.data || err.message);
        return res.status(err.response ? 502 : 500).json({
            status: false,
            message: 'Checkout could not be started. Please try again or contact support.'
        });
    }
});

/**
 * GET /api/payment/verify
 */
app.get('/api/payment/verify', async (req, res) => {
    const ref = req.query.reference || req.query.trxref;
    const baseUrl = getBaseUrl(req);

    if (!ref) {
        return res.status(400).send('<h1>Error</h1><p>Missing transaction reference.</p>');
    }

    try {
        const enrollment = await getAsync('SELECT * FROM enrollments WHERE reference = ?', [ref]);
        if (!enrollment) {
            return res.status(404).send('<h1>Not Found</h1><p>Application reference not found.</p>');
        }

        if (enrollment.status === 'completed' && enrollment.access_token) {
            return res.redirect(
                `/success.html?reference=${encodeURIComponent(ref)}&token=${encodeURIComponent(enrollment.access_token)}`
            );
        }

        let isSuccessful = false;

        if (isMockMode) {
            if (NODE_ENV === 'production') {
                isSuccessful = false;
            } else {
                isSuccessful = true;
            }
        } else {
            try {
                const verifyResponse = await axios.get(
                    `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,
                    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
                );
                const data = verifyResponse.data?.data;
                if (
                    verifyResponse.data?.status &&
                    data?.status === 'success' &&
                    Number(data.amount) === Math.round(Number(enrollment.amount) * 100)
                ) {
                    isSuccessful = true;
                }
            } catch (verifyError) {
                console.error('Paystack verify error:', verifyError.response?.data || verifyError.message);
            }
        }

        if (isSuccessful) {
            const fulfilled = await fulfillEnrollment(enrollment, baseUrl);
            return res.redirect(
                `/success.html?reference=${encodeURIComponent(ref)}&token=${encodeURIComponent(fulfilled.enrollment.access_token)}`
            );
        }

        await runAsync(
            'UPDATE enrollments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE reference = ? AND status != ?',
            ['failed', ref, 'completed']
        );
        return res.redirect(`/success.html?failed=true&reference=${encodeURIComponent(ref)}`);
    } catch (err) {
        console.error('Verify handler error', err);
        return res.status(500).send('<h1>Error</h1><p>Verification failed. Contact support with your reference.</p>');
    }
});

/**
 * POST /api/payment/webhook
 */
app.post('/api/payment/webhook', async (req, res) => {
    const signature = req.get('x-paystack-signature');

    if (!isMockMode) {
        if (!verifyPaystackSignature(req.rawBody, signature)) {
            console.warn('Webhook: invalid signature');
            return res.sendStatus(401);
        }
    }

    const event = req.body;
    if (!event || !event.event) {
        return res.sendStatus(400);
    }

    console.log(`Paystack webhook: ${event.event}`);

    if (event.event === 'charge.success') {
        const reference = event.data?.reference;
        if (!reference) return res.sendStatus(200);

        try {
            const enrollment = await getAsync('SELECT * FROM enrollments WHERE reference = ?', [reference]);
            if (!enrollment) {
                console.log(`Webhook: unknown reference ${reference}`);
                return res.sendStatus(200);
            }
            const baseUrl = PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
            await fulfillEnrollment(enrollment, baseUrl);
            return res.sendStatus(200);
        } catch (err) {
            console.error('Webhook fulfill error', err.message);
            return res.sendStatus(500);
        }
    }

    return res.sendStatus(200);
});

/**
 * GET /api/course/access?token=
 * Returns course content if token valid and paid.
 */
app.get('/api/course/access', async (req, res) => {
    const token = req.query.token;
    if (!token || String(token).length < 16) {
        return res.status(400).json({ status: false, message: 'Valid access token required.' });
    }

    try {
        const enrollment = await getAsync(
            'SELECT id, first_name, last_name, email, product_id, amount, reference, status, access_token, created_at FROM enrollments WHERE access_token = ?',
            [token]
        );
        if (!enrollment || enrollment.status !== 'completed') {
            return res.status(403).json({ status: false, message: 'Invalid or unpaid access token.' });
        }

        const product = getProduct(enrollment.product_id);
        res.json({
            status: true,
            data: {
                student: {
                    first_name: enrollment.first_name,
                    last_name: enrollment.last_name,
                    email: enrollment.email
                },
                product,
                reference: enrollment.reference,
                enrolled_at: enrollment.created_at,
                modules: getModules(),
                bonuses: getBonuses(enrollment.product_id)
            }
        });
    } catch (err) {
        console.error('Course access error', err.message);
        res.status(500).json({ status: false, message: 'Could not load course.' });
    }
});

/**
 * POST /api/course/resend
 * Resend course email if paid.
 */
app.post('/api/course/resend', async (req, res) => {
    const ip = req.ip || 'unknown';
    if (!rateLimit(`resend:${ip}`, 5, 60 * 60 * 1000)) {
        return res.status(429).json({ status: false, message: 'Too many resend attempts.' });
    }

    const { email, reference } = req.body || {};
    if (!email && !reference) {
        return res.status(400).json({ status: false, message: 'email or reference required.' });
    }

    try {
        let enrollment;
        if (reference) {
            enrollment = await getAsync('SELECT * FROM enrollments WHERE reference = ? AND status = ?', [
                reference,
                'completed'
            ]);
        } else {
            enrollment = await getAsync(
                'SELECT * FROM enrollments WHERE email = ? AND status = ? ORDER BY id DESC LIMIT 1',
                [String(email).trim().toLowerCase(), 'completed']
            );
        }

        if (!enrollment) {
            return res.status(404).json({ status: false, message: 'No completed enrollment found.' });
        }

        // Force re-send
        await runAsync('UPDATE enrollments SET email_sent = 0 WHERE id = ?', [enrollment.id]);
        enrollment.email_sent = 0;
        const baseUrl = getBaseUrl(req);
        const fulfilled = await fulfillEnrollment(enrollment, baseUrl);

        res.json({
            status: true,
            message: 'Course access email re-sent.',
            data: { access_url: fulfilled.accessUrl }
        });
    } catch (err) {
        console.error('Resend error', err.message);
        res.status(500).json({ status: false, message: 'Could not resend email.' });
    }
});

// Explicit HTML routes (cleaner than only static)
const pages = [
    'index',
    'jobs',
    'apply',
    'course',
    'course-access',
    'success',
    'landing',
    'about',
    'contact',
    'jobseekers',
    'compliance',
    'privacy',
    'terms'
];
pages.forEach((p) => {
    app.get(`/${p}.html`, (req, res) => {
        res.sendFile(path.join(__dirname, `${p}.html`));
    });
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 JSON for API, HTML for pages
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ status: false, message: 'API endpoint not found.' });
    }
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error', err.message);
    if (res.headersSent) return next(err);
    res.status(500).json({ status: false, message: 'Internal server error.' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log('=================================================');
        console.log(`RemoteMedicalJobs listening on port ${PORT}`);
        console.log(`Environment: ${NODE_ENV}`);
        console.log(`Mock Mode: ${isMockMode ? 'ACTIVE (dev)' : 'OFF (live Paystack)'}`);
        console.log(`URL: http://localhost:${PORT}`);
        console.log('=================================================');
    });
}

module.exports = app;
