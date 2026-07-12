const fs = require('fs');

// ---- index.html patches ----
{
    let h = fs.readFileSync('index.html', 'utf8');
    h = h.replace(/Apply Now/g, 'Apply · Cert Required');
    h = h.replace(
        /<a href="jobs\.html" class="btn btn-primary btn-lg">\s*View All Remote Jobs[\s\S]*?<\/a>/,
        `<a href="course.html" class="btn btn-primary btn-lg">
                    Get Certified — Then Apply
                    <span class="iconify" data-icon="mdi:arrow-right" aria-hidden="true"></span>
                </a>`
    );
    h = h.replace(
        /<!-- ===== CTA BANNER ===== -->[\s\S]*?<\/div>\s*\n\s*<div id="site-footer">/,
        `<!-- ===== CTA BANNER ===== -->
    <div class="cta-banner">
        <div class="cta-banner-pattern"></div>
        <h2 class="fade-up">Stop Competing Unprepared. Get Certified First.</h2>
        <p class="fade-up stagger-1">Remote healthcare employers shortlist candidates who already understand telehealth delivery, privacy, and remote professional standards. The Career Accelerator is the mandatory gateway to advance your application — one payment, lifetime portal access, emailed instantly.</p>
        <div class="cta-banner-ctas fade-up stagger-2">
            <a href="course.html" class="btn btn-white btn-lg">
                <span class="iconify" data-icon="mdi:certificate" aria-hidden="true"></span>
                Enrol Now — $27
            </a>
            <a href="apply.html" class="btn btn-outline-white btn-lg">
                <span class="iconify" data-icon="mdi:briefcase-check" aria-hidden="true"></span>
                Start Application
            </a>
        </div>
    </div>

    <div id="site-footer">`
    );

    // Fix counters — don't overwrite $27 / 8 with wrong animate values
    h = h.replace(
        /function startCounters\(\) \{[\s\S]*?animateCounter\(document\.getElementById\('statTrusts'\), 40, '\+', 1500\);\s*\}/,
        `function startCounters() {
            if (countersStarted) return;
            countersStarted = true;
            // Hero stats are static conversion numbers — leave as-is if already set
            const jobsEl = document.getElementById('statJobs');
            if (jobsEl && /^\\d+$/.test(jobsEl.textContent.trim())) {
                animateCounter(jobsEl, 12, '+', 1200);
            }
        }`
    );

    // Fix intersection observer with js-anim + safety fallback
    h = h.replace(
        /\/\/ ===== INTERSECTION OBSERVER \(Fade-up animations\) =====[\s\S]*?document\.querySelectorAll\('\.fade-up'\)\.forEach\(el => observer\.observe\(el\)\);/,
        `// ===== INTERSECTION OBSERVER (Fade-up animations) =====
        const fadeEls = document.querySelectorAll('.fade-up');
        // Progressive enhancement: only hide for animation if JS works
        fadeEls.forEach(el => el.classList.add('js-anim'));
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
            fadeEls.forEach(el => observer.observe(el));
        } else {
            fadeEls.forEach(el => el.classList.add('visible'));
        }
        // Safety: never leave text invisible
        setTimeout(() => {
            document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
        }, 900);`
    );

    // Chat bot null-safe
    h = h.replace(
        /chatToggle\.addEventListener\('click'/,
        "chatToggle && chatToggle.addEventListener('click'"
    );

    // Soften chat bot responses toward course
    h = h.replace(
        /const botResponses = \{[\s\S]*?\};\s*\n\s*function sendChat/,
        `const botResponses = {
            'job': "Browse our curated remote healthcare roles on the Jobs page. To advance an application, complete the Career Accelerator certification ($27) — it is required for placement shortlisting. Enrol at the Course page.",
            'course': "The Career Accelerator is $27 Standard or $47 Pro. You get 8 modules, templates, and instant email portal access. Certification is required to advance job applications.",
            'cert': "Yes — certification via the Career Accelerator is mandatory to advance applications to our placement desk. Enrol in under 2 minutes at course.html.",
            'price': "Standard certification is $27 USD one-time. Pro is $47 with interview bank + LinkedIn kit. Instant email delivery after Paystack checkout.",
            'nmc': "Registration rules depend on your country and employer. Our course covers multi-market privacy and remote readiness for global telehealth work.",
            'employ': "Employers can hire pre-certified remote healthcare talent. Contact us via the Contact page to discuss workforce solutions.",
            'salary': "Remote healthcare pay varies by role and market — telehealth nursing, pharmacy consults, coding, and informatics often pay competitive hourly or salaried rates. View live roles on Jobs.",
            'remote': "Remote healthcare is booming: telehealth, triage, coding, informatics, scheduling, and patient coordination. Get certified first, then apply.",
            'hello': "Welcome to RemoteMedicalJobs. I can help with certification, applications, or employer hiring. Most candidates start with the $27 Career Accelerator.",
            'hi': "Hi! Ready to get certified and apply for remote healthcare roles? Ask me about the course, jobs, or pricing."
        };

        function sendChat`
    );

    fs.writeFileSync('index.html', h);
    console.log('index.html conversion patches OK');
}

// ---- apply.html full rewrite of offer screen + SEO ----
{
    let h = fs.readFileSync('apply.html', 'utf8');
    h = h.replace(
        /<title>.*?<\/title>/,
        '<title>Apply for Remote Healthcare Jobs — Certification Required | RemoteMedicalJobs</title>'
    );
    h = h.replace(
        /<meta name="description" content="[^"]*">/,
        '<meta name="description" content="Apply for remote telehealth and healthcare jobs. Complete the mandatory $27 Career Accelerator certification to advance your application. Instant email course access.">'
    );
    h = h.replace(
        /<h1 id="pageTitle">Apply for remote healthcare roles<\/h1>\s*<p class="subtitle">[\s\S]*?<\/p>/,
        `<h1 id="pageTitle">Apply for remote healthcare roles</h1>
            <p class="subtitle">Submit your professional profile to our placement desk. To advance your application to partner shortlists, you must complete the <strong>Career Accelerator certification</strong> ($27) — the same standard our agency uses to pre-vet remote-ready talent worldwide.</p>`
    );
    h = h.replace(
        /Submit free application/,
        'Continue to certification'
    );
    h = h.replace(
        /<!-- Screen 2: honest upsell -->[\s\S]*?<!-- Screen 2:[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
        '' // will replace differently
    );

    // Replace screen 2 block more carefully
    const s2Start = h.indexOf('<!-- Screen 2:');
    const s2Alt = h.indexOf('id="screenOffer"');
    const start = s2Start !== -1 ? s2Start : (s2Alt !== -1 ? h.lastIndexOf('<div id="screenOffer"', s2Alt + 1) : -1);
    // Find screenOffer div
    const offerIdx = h.indexOf('id="screenOffer"');
    if (offerIdx !== -1) {
        const divStart = h.lastIndexOf('<div', offerIdx);
        // find matching close for screenOffer - go to after its closing and the parent structure
        // Simpler: replace from screenOffer opening through end of offer screen
        const re = /<div id="screenOffer" class="screen">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\n\n<div id="site-footer">/;
        if (re.test(h)) {
            h = h.replace(
                re,
                `<div id="screenOffer" class="screen">
            <div class="offer-badge" style="display:inline-flex;align-items:center;gap:8px;background:#ecfdf5;color:#047857;font-size:.78rem;font-weight:700;padding:6px 12px;border-radius:50px;margin-bottom:14px">STEP 2 OF 2 · CERTIFICATION REQUIRED</div>
            <h1>You're shortlisted for certification</h1>
            <p class="subtitle" id="offerSub">Your application is saved. Complete the Career Accelerator to unlock placement advancement.</p>
            <div class="offer">
                <h2>Why top remote employers require remote-ready talent</h2>
                <p style="font-size:.92rem;color:#334155;margin-bottom:12px">Premium digital clinics and telehealth networks do not want candidates who freeze on a video consult, mishandle privacy, or send a hospital-only CV. Our agency only advances applicants who complete the <strong>mandatory Career Accelerator</strong> — so your profile arrives employer-ready.</p>
                <ul>
                    <li><strong>Mandatory for application advancement</strong> — required next step after you apply</li>
                    <li>8 modules: telehealth skills, privacy (HIPAA/GDPR-style), CV &amp; interviews</li>
                    <li>Downloadable templates &amp; checklists used by serious candidates</li>
                    <li>Instant email delivery + lifetime portal access after secure checkout</li>
                    <li>One-time investment from <strong>$27</strong> — less than a single private CPD day</li>
                </ul>
                <div class="pricing">
                    <button type="button" class="price-card selected" data-product="standard" id="cardStandard">
                        <div style="font-weight:700;margin-bottom:4px">Standard</div>
                        <strong>$27</strong>
                        <span>Full certification + templates</span>
                    </button>
                    <button type="button" class="price-card" data-product="pro" id="cardPro">
                        <div style="font-weight:700;margin-bottom:4px">Pro · Most popular</div>
                        <strong>$47</strong>
                        <span>Course + interview bank + LinkedIn kit</span>
                    </button>
                </div>
                <button type="button" class="btn btn-green btn-lg" id="purchaseBtn">
                    Complete mandatory certification — $27
                </button>
                <p class="trust">Secure Paystack checkout · Instant email access · 30-day satisfaction policy · Required to advance applications</p>
            </div>
            <p style="margin-top:18px;text-align:center;font-size:.85rem;color:#64748b">Want the full curriculum first? <a href="course.html" style="color:#2563eb;font-weight:600">View course details</a></p>
        </div>
    </div>
</div>

<div id="site-footer">`
            );
        } else {
            console.log('apply screenOffer regex failed, trying fallback');
            // brute force cut from screenOffer to site-footer
            const a = h.indexOf('<div id="screenOffer"');
            const b = h.indexOf('<div id="site-footer">');
            if (a > 0 && b > a) {
                h =
                    h.slice(0, a) +
                    `<div id="screenOffer" class="screen">
            <div style="display:inline-flex;align-items:center;gap:8px;background:#ecfdf5;color:#047857;font-size:.78rem;font-weight:700;padding:6px 12px;border-radius:50px;margin-bottom:14px">STEP 2 OF 2 · CERTIFICATION REQUIRED</div>
            <h1>You're shortlisted for certification</h1>
            <p class="subtitle" id="offerSub">Your application is saved. Complete the Career Accelerator to unlock placement advancement.</p>
            <div class="offer">
                <h2>Why top remote employers require remote-ready talent</h2>
                <p style="font-size:.92rem;color:#334155;margin-bottom:12px">Premium digital clinics and telehealth networks shortlist candidates who already understand video consults, privacy, and remote professional standards. <strong>Certification is mandatory</strong> to advance your application through our placement desk.</p>
                <ul>
                    <li><strong>Mandatory for application advancement</strong></li>
                    <li>8 modules + templates + interview prep</li>
                    <li>Instant email portal access after payment</li>
                    <li>From <strong>$27</strong> one-time · Worldwide</li>
                </ul>
                <div class="pricing">
                    <button type="button" class="price-card selected" data-product="standard" id="cardStandard">
                        <div style="font-weight:700;margin-bottom:4px">Standard</div>
                        <strong>$27</strong>
                        <span>Full certification + templates</span>
                    </button>
                    <button type="button" class="price-card" data-product="pro" id="cardPro">
                        <div style="font-weight:700;margin-bottom:4px">Pro · Most popular</div>
                        <strong>$47</strong>
                        <span>Course + interview bank + LinkedIn kit</span>
                    </button>
                </div>
                <button type="button" class="btn btn-green btn-lg" id="purchaseBtn">
                    Complete mandatory certification — $27
                </button>
                <p class="trust">Secure Paystack checkout · Instant email access · Required to advance applications</p>
            </div>
            <p style="margin-top:18px;text-align:center;font-size:.85rem;color:#64748b"><a href="course.html" style="color:#2563eb;font-weight:600">View full course details →</a></p>
        </div>
    </div>
</div>

` +
                    h.slice(b);
            }
        }
    }

    h = h.replace(
        /document\.getElementById\('offerSub'\)\.textContent =\s*`Thanks \$\{candidate\.first_name\}![\s\S]*?`;/,
        `document.getElementById('offerSub').textContent =
            \`Excellent, \${candidate.first_name} — your profile is in. Complete your mandatory Career Accelerator certification to advance this application to our placement desk.\`;`
    );
    h = h.replace(
        /btn\.innerHTML = 'Submit free application[\s\S]*?';/,
        `btn.innerHTML = 'Continue to certification <span class="iconify" data-icon="mdi:arrow-right"></span>';`
    );
    h = h.replace(
        /Get course access \(\$27\) — email delivery/g,
        'Complete mandatory certification — $27'
    );
    h = h.replace(
        /Get Pro access \(\$47\) — email delivery/g,
        'Complete Pro certification — $47'
    );

    fs.writeFileSync('apply.html', h);
    console.log('apply.html conversion OK');
}

// ---- jobseekers, about, landing, terms, contact, jobs CTAs ----
function patchFile(file, fn) {
    let h = fs.readFileSync(file, 'utf8');
    h = fn(h);
    fs.writeFileSync(file, h);
    console.log('patched', file);
}

patchFile('jobseekers.html', (h) => {
    h = h.replace(
        /<title>.*?<\/title>/,
        '<title>Remote Healthcare Job Seeker Hub — Get Certified & Hired | RemoteMedicalJobs</title>'
    );
    h = h.replace(
        /<meta name="description"[^>]*>/,
        ''
    );
    h = h.replace(
        '</title>',
        `</title>
    <meta name="description" content="Job seeker hub for remote nursing, telehealth, pharmacy and digital health careers. Mandatory $27 Career Accelerator certification advances your applications worldwide.">`
    );
    // replace main card content
    const start = h.indexOf('<div class="wrap">');
    const end = h.indexOf('<div id="site-footer">');
    if (start > -1 && end > start) {
        h =
            h.slice(0, start) +
            `<div class="wrap"><div class="card">
    <h1>For ambitious remote healthcare job seekers</h1>
    <p class="lead">Browse curated roles, then complete the <strong>mandatory Career Accelerator certification ($27)</strong> to advance applications to our placement desk. Built like a premium agency funnel — not a free-for-all job board.</p>
    <div class="grid">
        <div class="panel">
            <h2 style="font-size:1.1rem;margin:0 0 12px">Quick job search</h2>
            <input id="q" placeholder="Job title, keyword, speciality…">
            <select id="loc">
                <option value="">Anywhere (Remote)</option>
                <option>Worldwide / Global</option>
                <option>Americas</option>
                <option>Europe / UK</option>
                <option>Africa</option>
                <option>Asia-Pacific</option>
            </select>
            <button class="btn" type="button" id="searchBtn">Search jobs</button>
            <p style="font-size:.8rem;color:#64748b;margin-top:10px">Viewing jobs is free. Advancing an application requires certification.</p>
        </div>
        <div>
            <h2 style="font-size:1.1rem;margin:0 0 12px">High-conversion next steps</h2>
            <a class="link-card" href="course.html">
                <strong>1. Get certified — from $27</strong>
                <span>8 modules, templates, email portal. Mandatory to advance applications.</span>
            </a>
            <a class="link-card" href="apply.html">
                <strong>2. Submit application + certification path</strong>
                <span>Profile capture → secure checkout for Career Accelerator.</span>
            </a>
            <a class="link-card" href="jobs.html">
                <strong>3. Browse live remote listings</strong>
                <span>Telehealth, nursing, pharmacy, coding, informatics & more.</span>
            </a>
        </div>
    </div>
    <section style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0">
        <h2 style="font-size:1.15rem;font-weight:800;margin:0 0 10px">Why certification is required</h2>
        <p style="color:#475569;line-height:1.7;margin:0 0 12px">Remote clinics lose money on candidates who are clinically strong but operationally unprepared. Our Career Accelerator standardises telehealth skills, privacy awareness, and remote professional packaging — so when you apply, you look hire-ready from day one.</p>
        <a class="btn" href="course.html" style="width:auto;display:inline-flex;padding:12px 22px">Enrol in Career Accelerator →</a>
    </section>
</div></div>
` +
            h.slice(end);
    }
    return h;
});

patchFile('about.html', (h) => {
    return h.replace(
        /<div class="wrap"><div class="card">[\s\S]*<\/div><\/div>\s*<div id="site-footer">/,
        `<div class="wrap"><div class="card">
    <h1>About RemoteMedicalJobs</h1>
    <p>RemoteMedicalJobs is a global remote healthcare careers agency pathway. We combine a curated job board with a high-performance Career Accelerator that candidates complete to become placement-ready for telehealth and digital health employers.</p>
    <p>Unlike passive job boards, we operate like a placement-focused agency: <strong>certification is mandatory to advance applications</strong>. That protects employer partners and dramatically increases candidate competitiveness in a crowded remote market.</p>
    <div class="grid">
        <div class="box">
            <h3>🌍 Global talent, remote roles</h3>
            <p>Candidates and openings across time zones — nursing, pharmacy, coding, informatics, scheduling, and coordination.</p>
        </div>
        <div class="box">
            <h3>🎓 Mandatory Career Accelerator</h3>
            <p>From $27. Eight practical modules + templates. Access emailed instantly after secure payment.</p>
        </div>
        <div class="box">
            <h3>⚡ Agency-grade funnel</h3>
            <p>Apply → certify → shortlist. Built for conversion and quality, not empty applications.</p>
        </div>
        <div class="box">
            <h3>🤝 Employer partnerships</h3>
            <p>Digital clinics and healthtech teams receive pre-interested, certified remote talent. Contact us to hire.</p>
        </div>
    </div>
    <h2 style="font-size:1.15rem;font-weight:800;margin:36px 0 12px">Our model</h2>
    <p>We list vetted remote and hybrid healthcare opportunities and require the Career Accelerator for application advancement. Course access is delivered by email with a private portal link. We do not guarantee interviews, employment, visas, or salary outcomes — we equip you to compete at a professional standard.</p>
    <h2 style="font-size:1.15rem;font-weight:800;margin:28px 0 12px">SEO-focused services</h2>
    <p>Remote nurse jobs · Telehealth careers · Medical scheduler training · HIPAA/GDPR-aware remote work skills · Remote pharmacist roles · Health informatics jobs · Medical coding remote · International healthcare remote work</p>
    <p style="margin-top:28px">
        <a href="course.html" style="color:#2563eb;font-weight:600">Get certified — $27 →</a> &nbsp;·&nbsp;
        <a href="apply.html" style="color:#2563eb;font-weight:600">Apply now →</a> &nbsp;·&nbsp;
        <a href="contact.html" style="color:#2563eb;font-weight:600">Employers: hire talent →</a>
    </p>
</div></div>
<div id="site-footer">`
    );
});

patchFile('landing.html', (h) => {
    h = h.replace(
        /Optional Career Accelerator course — access emailed after secure payment\./,
        'Mandatory Career Accelerator certification ($27) to advance applications — access emailed after secure payment.'
    );
    h = h.replace(
        /No fake “limited slots\.” Browse real listings free, submit your profile free, and optionally unlock the Career Accelerator — training emailed to you after secure Paystack checkout\./,
        'Browse roles, submit your profile, then complete the mandatory Career Accelerator certification — the same pathway serious remote candidates use to get shortlisted. Training emailed instantly after Paystack checkout.'
    );
    h = h.replace(
        /Apply free \+ optional course/,
        'Apply + get certified'
    );
    h = h.replace(
        /Browse jobs/,
        'Get certified — $27'
    );
    h = h.replace(
        /href="jobs\.html" class="inline-flex items-center justify-center gap-2 bg-white/,
        'href="course.html" class="inline-flex items-center justify-center gap-2 bg-white'
    );
    return h;
});

patchFile('terms.html', (h) => {
    h = h.replace(
        /The Course is <strong>optional<\/strong> and is not a mandatory fee to browse jobs or submit a free application\./,
        'You may browse job listings without purchase. However, <strong>completing the Course (Career Accelerator) is required to advance a job application</strong> through our placement process. Pricing is disclosed before checkout ($27 Standard / $47 Pro).'
    );
    return h;
});

patchFile('contact.html', (h) => {
    h = h.replace(
        /<title>.*?<\/title>/,
        '<title>Contact RemoteMedicalJobs — Hiring & Course Support</title>'
    );
    h = h.replace(
        /Job seekers, employers, and course students worldwide — we typically reply within 1 business day\./,
        'Job seekers completing certification, employers hiring remote healthcare talent, and students needing portal access — we typically reply within 1 business day. Ready to enrol? <a href="course.html" style="color:#2563eb;font-weight:600">Get certified for $27 →</a>'
    );
    return h;
});

// jobs.html - update apply button labels if present
{
    let h = fs.readFileSync('jobs.html', 'utf8');
    h = h.replace(/Apply Now/g, 'Apply · Cert Required');
    if (!h.includes('name="description"')) {
        h = h.replace(
            '</title>',
            `</title>
    <meta name="description" content="Browse remote healthcare jobs in telehealth, nursing, pharmacy, coding and informatics. Certification via the $27 Career Accelerator is required to advance applications.">`
        );
    }
    // hero blurb
    h = h.replace(
        /Curated remote and hybrid healthcare roles from digital clinics, healthtech, and global care teams\. Apply free — optional career training available\./,
        'Curated remote and hybrid healthcare roles from digital clinics, healthtech, and global care teams. Browse free — Career Accelerator certification ($27) is required to advance your application.'
    );
    fs.writeFileSync('jobs.html', h);
    console.log('jobs.html CTAs OK');
}

// course.html SEO meta boost if thin
{
    let h = fs.readFileSync('course.html', 'utf8');
    if (h.includes('<meta name="description"')) {
        h = h.replace(
            /<meta name="description" content="[^"]*">/,
            '<meta name="description" content="Remote Healthcare Career Accelerator — mandatory certification for job applications. 8 modules, templates, HIPAA/GDPR-style privacy, CV & interviews. From $27. Instant email portal access.">'
        );
    }
    h = h.replace(
        /<title>.*?<\/title>/,
        '<title>Career Accelerator Certification $27 — Required for Remote Job Applications | RemoteMedicalJobs</title>'
    );
    // Add keywords meta if missing
    if (!h.includes('name="keywords"')) {
        h = h.replace(
            '<meta name="description"',
            '<meta name="keywords" content="remote healthcare course, telehealth certification, remote nurse training, medical scheduler course, HIPAA training online, career accelerator">\n    <meta name="description"'
        );
    }
    fs.writeFileSync('course.html', h);
    console.log('course.html SEO OK');
}

console.log('All conversion patches done');
