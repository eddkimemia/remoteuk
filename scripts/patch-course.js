const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'course.html');
let h = fs.readFileSync(file, 'utf8');

h = h.replace(/href="index\.html#seekers"/g, 'href="jobseekers.html"');
h = h.replace(/href="index\.html#about"/g, 'href="about.html"');
h = h.replace(/href="index\.html#contact"/g, 'href="contact.html"');

h = h.replace(
    /href="index\.html" class="btn btn-primary" onclick="openEnroll\(\)"/g,
    'href="#" class="btn btn-primary" onclick="openEnroll();return false"'
);
h = h.replace(
    /href="index\.html" class="btn btn-primary btn-lg" onclick="openEnroll\(\)"/g,
    'href="#" class="btn btn-primary btn-lg" onclick="openEnroll();return false"'
);
h = h.replace(
    /href="index\.html" class="btn btn-green btn-xl" onclick="openEnroll\(\)"/g,
    'href="#" class="btn btn-green btn-xl" onclick="openEnroll();return false"'
);
h = h.replace(
    /href="index\.html" class="btn btn-white btn-xl" onclick="openEnroll\(\)"/g,
    'href="#" class="btn btn-white btn-xl" onclick="openEnroll();return false"'
);

h = h.replace(/Recognised by NHS Employers/g, 'Recognised for CPD-style professional development');
h = h.replace(/NHS employers/g, 'healthcare employers worldwide');
h = h.replace(
    /NHS Trusts, private healthcare providers/g,
    'hospitals, private providers, and digital health companies'
);
h = h.replace(/2,400\+/g, 'thousands of');
h = h.replace(
    /89% of our graduates who actively apply through our platform land a remote healthcare role within 60 days/g,
    'learners who complete the program and apply consistently report stronger interview readiness within 60 days'
);

// Replace processPayment body amount with product_id
h = h.replace(
    /body: JSON\.stringify\(\{\s*first_name: f,\s*last_name: l,\s*email: e,\s*profession: p,\s*amount: 27\s*\}\)/,
    `body: JSON.stringify({
                first_name: f,
                last_name: l,
                email: e,
                profession: p,
                country: (document.getElementById('payCountry')||{}).value || '',
                product_id: (document.querySelector('input[name="payProduct"]:checked')||{value:'standard'}).value,
                goals: 'Direct course enrollment'
            })`
);

h = h.replace(
    /showToast\('Redirecting to secure Paystack checkout\.\.\.'\);/,
    "showToast('Course link will be emailed after payment. Redirecting…');"
);
h = h.replace(
    /Pay \$27 — Proceed to Secure Paystack Checkout/g,
    'Pay securely — course emailed after payment'
);
h = h.replace(/Pay \$27 — Get Instant Access/g, 'Pay securely — Get access by email');
h = h.replace(/Get Instant Access — \$27/g, 'Get Access by Email');
h = h.replace(/Instant access/g, 'Email delivery + portal access');

// Inject product picker into enroll modal pricing block
const pricingBlock = `<div style="margin-bottom:14px">
                    <label style="font-size:.8rem;font-weight:600;display:block;margin-bottom:8px">Choose your plan</label>
                    <label style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:2px solid var(--green-600);border-radius:12px;margin-bottom:8px;cursor:pointer;background:var(--green-50)">
                        <input type="radio" name="payProduct" value="standard" checked style="margin-top:4px">
                        <span><strong>Standard — $27</strong><br><span style="font-size:.8rem;color:var(--slate-500)">8 modules + templates · emailed instantly</span></span>
                    </label>
                    <label style="display:flex;gap:10px;align-items:flex-start;padding:12px;border:2px solid var(--slate-200);border-radius:12px;cursor:pointer;margin-bottom:8px">
                        <input type="radio" name="payProduct" value="pro" style="margin-top:4px">
                        <span><strong>Pro — $47</strong><br><span style="font-size:.8rem;color:var(--slate-500)">Everything + interview bank + LinkedIn kit</span></span>
                    </label>
                    <div class="form-group" style="margin-bottom:0">
                        <label>Country / region</label>
                        <input type="text" class="form-input" id="payCountry" placeholder="Your country (worldwide)">
                    </div>
                </div>`;

const oldPricing =
    /<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">[\s\S]*?SAVE \$170<\/div>\s*<\/div>/;
if (oldPricing.test(h)) {
    h = h.replace(oldPricing, pricingBlock);
} else {
    console.warn('Pricing block not found — manual check needed');
}

// Secure modal note
h = h.replace(
    /Payments processed securely via Paystack\. 30-day money-back guarantee\./g,
    'Secure Paystack checkout. Course access is emailed to you after payment. 30-day satisfaction policy.'
);

// Deep link product=pro
if (!h.includes('payProduct') || !h.includes('_qp.get("product")')) {
    h = h.replace(
        '// ===== INIT =====',
        `// ===== INIT =====
const _qp = new URLSearchParams(location.search);
if (_qp.get('product') === 'pro') {
    setTimeout(() => {
        openEnroll();
        const r = document.querySelector('input[name="payProduct"][value="pro"]');
        if (r) r.checked = true;
    }, 400);
}
`
    );
}

// Soften UK-only meta description if present
h = h.replace(
    'The essential course for landing remote healthcare roles globally. 8 modules, expert instructors, certificate included. Enrol for just $27.',
    'Global remote healthcare career course. 8 modules, templates, compliance essentials. Access emailed after payment — from $27.'
);

fs.writeFileSync(file, h);
console.log('Patched course.html OK');
console.log('has product_id', h.includes('product_id'));
console.log('has payProduct', h.includes('payProduct'));
console.log('has payCountry', h.includes('payCountry'));
