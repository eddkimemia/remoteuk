# Remote Clinical Job Board & Course Accelerator (Express + SQLite + Paystack Funnel)

A highly optimized, production-grade remote healthcare job board funnel. It converts medical job seekers (Nurses, Pharmacists, GPs, AHPs, etc.) applying for remote positions into certified, compliant telehealth specialists through a high-converting **"Pivot"** marketing funnel.

This system is fully integrated with a production-ready **Node.js Express** backend, storing candidate records in an **SQLite** database, and processing secure compliance training checkouts using **Paystack**.

---

## 🚀 Key Features

* **Dual-Stage Funnel Flow:**
  * **Page 1 (Traffic):** `index.html` & `jobs.html` listing high-quality remote clinic roles. Every single CTA reads `👉 APPLY NOW – LIMITED SLOTS AVAILABLE` and funnels candidates instantly to the evaluation stage.
  * **Page 2 (The Qualification & Pivot):** `apply.html` serves as the initial clinical qualification form. Upon submission, it triggers **The Pivot**: a modal/screen transition alerting candidates they qualify, but requires a mandatory *Telehealth Compliance & Scheduling Certification (HIPAA/GDPR)*.
  * **Secure Paystack Checkout:** Candidates can click the `🎓 GET COURSE NOW – ONLY $27` Offer Button to securely purchase training via Paystack redirect or local sandbox fallback.
* **Production Node.js Backend:**
  * Clean, robust architecture inside `server.js` with structured API routes, CORS configuration, SQLite persistence, and graceful error boundaries.
  * Fallback routing fully compatible with Express v5/v6 wildcard patterns.
* **Fully Automated Tests:**
  * Integrated testing via `test.js` validating mock payment initializations, SQLite storage, callback status transitions, and synchronous/asynchronous event hooks.

---

## 🛠️ Technology Stack

* **Frontend:** Vanilla HTML5, CSS3, modern Tailwind-equivalent custom stylesheet, Iconify, Playwright (for automated UI visual testing).
* **Backend:** Node.js, Express.js.
* **Database:** SQLite3 (uses local file `database.sqlite` automatically).
* **Payments:** Paystack API Integration (`axios` Client).

---

## 📦 Getting Started

### 1. Prerequisites
Ensure you have Node.js (version 18 or above) installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory:
```env
PORT=3000
PAYSTACK_SECRET_KEY=sk_live_your_actual_key_here
```
*Note: If `PAYSTACK_SECRET_KEY` is not provided, the application will automatically activate **Sandbox Mock Mode**, allowing you to fully test the payment flows locally without any API keys.*

### 4. Run the Server
```bash
npm start
```
The server will start at `http://localhost:3000`.

### 5. Running Automated Integration Tests
```bash
npm test
```

---

## 📡 API Reference

### 1. Initialize Paystack Transaction
* **Endpoint:** `POST /api/payment/initialize`
* **Payload:**
  ```json
  {
    "first_name": "Sarah",
    "last_name": "Mitchell",
    "email": "sarah.mitchell@example.com",
    "phone": "+447700900077",
    "country": "United Kingdom",
    "experience": "3-5",
    "profession": "nurse",
    "goals": "Eligibility check.",
    "amount": 27
  }
  ```
* **Response:**
  ```json
  {
    "status": true,
    "message": "Initialization successful",
    "data": {
      "authorization_url": "https://checkout.paystack.com/...",
      "access_code": "...",
      "reference": "RMJ-178..."
    }
  }
  ```

### 2. Verify Paystack Payment Callback
* **Endpoint:** `GET /api/payment/verify?reference=<REF>`
* **Description:** Handles redirects from Paystack checkout, updates database status, and redirects the candidate to `success.html?reference=<REF>`.

### 3. Asynchronous Paystack Webhook
* **Endpoint:** `POST /api/payment/webhook`
* **Description:** Secures payments in the background (highly reliable). Updates DB enrollment state on `charge.success` events.

---

## 🛡️ License
Designed and developed to absolute production grade for Remote Clinical Specialists worldwide. © 2025. All rights reserved.
