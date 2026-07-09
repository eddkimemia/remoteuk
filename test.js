const assert = require('assert').strict;
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const server = require('./server'); // loads our express app instance

// Retrieve standard test variables
const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Utility to make HTTP requests during test
 */
function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                body: data
            }));
        });
        req.on('error', (err) => reject(err));
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    console.log('=================================================');
    console.log('RUNNING SYSTEM INTEGRATION & ENDPOINT UNIT TESTS');
    console.log('=================================================');

    try {
        // Test 1: Verify database connection and schema
        console.log('Test 1: Verifying SQLite Database and Schema...');
        const dbPath = path.join(__dirname, 'database.sqlite');
        const db = new sqlite3.Database(dbPath);

        await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(enrollments)", (err, columns) => {
                if (err) return reject(err);
                const colNames = columns.map(c => c.name);
                assert(colNames.includes('first_name'), 'Missing first_name column');
                assert(colNames.includes('email'), 'Missing email column');
                assert(colNames.includes('reference'), 'Missing reference column');
                assert(colNames.includes('status'), 'Missing status column');
                console.log('   -> Database Schema successfully validated!');
                resolve();
            });
        });

        // Test 2: POST /api/payment/initialize validation
        console.log('Test 2: Verifying Validation on /api/payment/initialize...');
        const failPayload = { first_name: 'Jane', last_name: 'Doe' }; // missing email and profession
        const failRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/payment/initialize',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, failPayload);

        assert.equal(failRes.statusCode, 400);
        const failBody = JSON.parse(failRes.body);
        assert.equal(failBody.status, false);
        assert(failBody.message.includes('Validation failed'));
        console.log('   -> Input validation successfully verified!');

        // Test 3: POST /api/payment/initialize successful transaction
        console.log('Test 3: Verifying Successful Initialize API...');
        const successPayload = {
            first_name: 'Sarah',
            last_name: 'Mitchell',
            email: 'sarah.mitchell@test.com',
            phone: '07700900077',
            profession: 'nurse',
            reg_body: 'nmc',
            reg_num: '15A0123E',
            linkedin: 'https://linkedin.com/in/sarah-mitchell-test',
            goals: 'Land a remote nurse practitioner role within 60 days',
            amount: 27
        };

        const successRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/payment/initialize',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, successPayload);

        assert.equal(successRes.statusCode, 200);
        const successBody = JSON.parse(successRes.body);
        assert.equal(successBody.status, true);
        assert(successBody.data.authorization_url, 'Missing authorization URL');
        assert(successBody.data.reference, 'Missing reference ID');
        const ref = successBody.data.reference;
        console.log(`   -> Transaction successfully initialized with reference: ${ref}`);

        // Verify SQLite insert
        await new Promise((resolve, reject) => {
            db.get('SELECT * FROM enrollments WHERE reference = ?', [ref], (err, row) => {
                if (err) return reject(err);
                assert(row, 'Database row not inserted for reference');
                assert.equal(row.first_name, 'Sarah');
                assert.equal(row.status, 'pending');
                assert.equal(row.amount, 27);
                console.log('   -> SQLite persistence correctly verified!');
                resolve();
            });
        });

        // Test 4: GET /api/payment/verify callback endpoint
        console.log('Test 4: Verifying Payment Callback & Redirect verification...');
        const verifyRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: `/api/payment/verify?reference=${ref}`,
            method: 'GET'
        });

        // Verify endpoint redirects with 302 Found
        assert.equal(verifyRes.statusCode, 302);
        assert(verifyRes.headers.location.includes('success.html'), 'Does not redirect to success.html');
        assert(verifyRes.headers.location.includes(ref), 'Missing reference query parameter in redirect');
        assert(verifyRes.headers.location.includes('Sarah'), 'Missing candidate name in redirect');
        console.log('   -> Payment verification redirects verified!');

        // Confirm database status transitioned to completed
        await new Promise((resolve, reject) => {
            db.get('SELECT * FROM enrollments WHERE reference = ?', [ref], (err, row) => {
                if (err) return reject(err);
                assert.equal(row.status, 'completed', 'Database status not transitioned to completed');
                console.log('   -> Database enrollment state transition successfully validated!');
                resolve();
            });
        });

        // Test 5: POST /api/payment/webhook asynchronous payment processing
        console.log('Test 5: Verifying webhook asynchronous handler...');
        const webhookRef = 'RMJ-WEBHOOK-' + Date.now();

        // Let's manually register a pending row for webhook tests
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO enrollments (first_name, last_name, email, profession, amount, reference, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['Emma', 'Rahman', 'emma@test.com', 'coordinator', 27, webhookRef, 'pending'],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });

        // Simulate Paystack charge.success webhook event payload
        const webhookPayload = {
            event: 'charge.success',
            data: {
                reference: webhookRef,
                status: 'success',
                amount: 2700
            }
        };

        const webhookRes = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/payment/webhook',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, webhookPayload);

        assert.equal(webhookRes.statusCode, 200);

        // Verify state is completed in db
        await new Promise((resolve, reject) => {
            db.get('SELECT * FROM enrollments WHERE reference = ?', [webhookRef], (err, row) => {
                if (err) return reject(err);
                assert.equal(row.status, 'completed');
                console.log('   ✓ DB state correctly updated via Paystack Webhook API');
                resolve();
            });
        });

        db.close();
        console.log('=================================================');
        console.log('ALL INTEGRATION & UNIT TESTS PASSED SUCCESSFULLY! 🎉');
        console.log('=================================================');
        process.exit(0);

    } catch (error) {
        console.error('=================================================');
        console.error('TEST FAILURES ENCOUNTERED! ❌');
        console.error(error);
        console.error('=================================================');
        process.exit(1);
    }
}

// Allow time for Express server to start, then execute tests
setTimeout(runTests, 1500);
