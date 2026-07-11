const assert = require('assert').strict;
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure mock mode for tests (ignore any .env Paystack key)
process.env.FORCE_MOCK_PAYMENTS = 'true';
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.TEST_PORT || '3456';

const app = require('./server');
const PORT = parseInt(process.env.PORT, 10);
const BASE = `http://127.0.0.1:${PORT}`;

function request(method, urlPath, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const req = http.request(
            {
                hostname: '127.0.0.1',
                port: PORT,
                path: urlPath,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
                    ...headers
                }
            },
            (res) => {
                let raw = '';
                res.on('data', (c) => (raw += c));
                res.on('end', () =>
                    resolve({ statusCode: res.statusCode, headers: res.headers, body: raw })
                );
            }
        );
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('=================================================');
    console.log('RUNNING INTEGRATION TESTS');
    console.log('=================================================');

    const server = await new Promise((resolve) => {
        const s = app.listen(PORT, '127.0.0.1', () => resolve(s));
    });

    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new sqlite3.Database(dbPath);

    try {
        // Health
        console.log('Test 1: Health check…');
        const health = await request('GET', '/api/health');
        assert.equal(health.statusCode, 200);
        assert.equal(JSON.parse(health.body).status, true);
        console.log('   OK');

        // Validation
        console.log('Test 2: Payment validation…');
        const fail = await request('POST', '/api/payment/initialize', { first_name: 'Jane' });
        assert.equal(fail.statusCode, 400);
        assert.equal(JSON.parse(fail.body).status, false);
        console.log('   OK');

        // Initialize ignores client amount; uses product
        console.log('Test 3: Initialize with product_id (server price)…');
        const init = await request('POST', '/api/payment/initialize', {
            first_name: 'Sarah',
            last_name: 'Mitchell',
            email: 'sarah.mitchell@test.com',
            phone: '+15551234567',
            profession: 'nurse',
            country: 'United States',
            experience: '3-5',
            product_id: 'standard',
            amount: 1 // should be ignored
        });
        assert.equal(init.statusCode, 200);
        const initBody = JSON.parse(init.body);
        assert.equal(initBody.status, true);
        assert.ok(initBody.data.authorization_url);
        assert.equal(initBody.data.amount, 27);
        const ref = initBody.data.reference;
        console.log('   ref:', ref);

        await new Promise((resolve, reject) => {
            db.get('SELECT * FROM enrollments WHERE reference = ?', [ref], (err, row) => {
                if (err) return reject(err);
                assert.ok(row);
                assert.equal(row.amount, 27);
                assert.equal(row.status, 'pending');
                assert.equal(row.country, 'United States');
                resolve();
            });
        });
        console.log('   SQLite OK');

        // Verify + fulfill + email outbox
        console.log('Test 4: Verify payment + course fulfill…');
        const verify = await request('GET', `/api/payment/verify?reference=${ref}`);
        assert.equal(verify.statusCode, 302);
        assert.ok(verify.headers.location.includes('success.html'));
        assert.ok(verify.headers.location.includes('token='));
        const token = new URL(verify.headers.location, BASE).searchParams.get('token');
        assert.ok(token);

        await new Promise((resolve, reject) => {
            db.get('SELECT * FROM enrollments WHERE reference = ?', [ref], (err, row) => {
                if (err) return reject(err);
                assert.equal(row.status, 'completed');
                assert.ok(row.access_token);
                assert.equal(row.email_sent, 1);
                resolve();
            });
        });

        const outbox = path.join(__dirname, 'emails-outbox');
        assert.ok(fs.existsSync(outbox), 'emails-outbox should exist');
        console.log('   fulfill + email outbox OK');

        // Course access API
        console.log('Test 5: Course access API…');
        const access = await request('GET', `/api/course/access?token=${token}`);
        assert.equal(access.statusCode, 200);
        const accessBody = JSON.parse(access.body);
        assert.equal(accessBody.status, true);
        assert.ok(accessBody.data.modules.length >= 8);
        console.log('   OK');

        // Client cannot underpay via amount
        console.log('Test 6: Pro product price…');
        const pro = await request('POST', '/api/payment/initialize', {
            first_name: 'Pro',
            last_name: 'User',
            email: 'pro@test.com',
            profession: 'scheduler',
            product_id: 'pro'
        });
        assert.equal(pro.statusCode, 200);
        assert.equal(JSON.parse(pro.body).data.amount, 47);
        console.log('   OK');

        // Applications + contact
        console.log('Test 7: Applications & contact…');
        const appRes = await request('POST', '/api/applications', {
            first_name: 'A',
            last_name: 'B',
            email: 'ab@test.com',
            profession: 'nurse',
            country: 'Nigeria'
        });
        assert.equal(appRes.statusCode, 201);

        const contact = await request('POST', '/api/contact', {
            first_name: 'C',
            last_name: 'D',
            email: 'cd@test.com',
            inquiry_type: 'seeker',
            message: 'Hello from tests — need course help please.'
        });
        assert.equal(contact.statusCode, 201);
        console.log('   OK');

        // Webhook mock
        console.log('Test 8: Webhook…');
        const whRef = 'RMJ-WEBHOOK-' + Date.now();
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO enrollments (first_name,last_name,email,profession,amount,reference,status,product_id)
                 VALUES (?,?,?,?,?,?,?,?)`,
                ['Emma', 'Rahman', 'emma@test.com', 'coordinator', 27, whRef, 'pending', 'standard'],
                (err) => (err ? reject(err) : resolve())
            );
        });
        const wh = await request('POST', '/api/payment/webhook', {
            event: 'charge.success',
            data: { reference: whRef, status: 'success', amount: 2700 }
        });
        assert.equal(wh.statusCode, 200);
        await new Promise((resolve, reject) => {
            db.get('SELECT * FROM enrollments WHERE reference = ?', [whRef], (err, row) => {
                if (err) return reject(err);
                assert.equal(row.status, 'completed');
                assert.ok(row.access_token);
                resolve();
            });
        });
        console.log('   OK');

        // 404 API
        console.log('Test 9: API 404…');
        const n404 = await request('GET', '/api/does-not-exist');
        assert.equal(n404.statusCode, 404);
        console.log('   OK');

        db.close();
        console.log('=================================================');
        console.log('ALL TESTS PASSED');
        console.log('=================================================');
        server.close();
        process.exit(0);
    } catch (error) {
        console.error('TEST FAILURE', error);
        db.close();
        server.close();
        process.exit(1);
    }
}

// Wait for schema init
setTimeout(runTests, 800);
