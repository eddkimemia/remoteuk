const fs = require('fs');

function write(file, h) {
    fs.writeFileSync(file, h);
    console.log('updated', file);
}

// ---- chrome.js ----
{
    let h = fs.readFileSync('js/chrome.js', 'utf8');
    h = h.replace(
        /Get Certified — \$27/g,
        'Career Accelerator'
    );
    h = h.replace(
        /Premium remote healthcare placement pathway\. Get certified through our Career Accelerator, then apply to vetted telehealth and digital health roles worldwide\./,
        'Remote healthcare careers and practical Career Accelerator training. Browse roles, apply free, and unlock interview-ready skills when you are ready to stand out.'
    );
    h = h.replace(
        /<a href="apply\.html">Apply — get certified<\/a>/,
        '<a href="apply.html">Apply for roles</a>'
    );
    h = h.replace(
        /Hire certified talent/,
        'Hire remote talent'
    );
    write('js/chrome.js', h);
}

// ---- apply.html (critical) ----
{
    let h = fs.readFileSync('apply.html', 'utf8');
    h = h.replace(
        /<title>.*?<\/title>/,
        '<title>Apply for Remote Healthcare Jobs | RemoteMedicalJobs</title>'
    );
    h = h.replace(
        /<meta name="description" content="[^"]*">/,
        '<meta name="description" content="Apply free for remote telehealth and healthcare roles worldwide. After you apply, unlock interview-ready Career Accelerator training delivered to your email.">'
    );
    h = h.replace(
        /<h1 id="pageTitle">Apply for remote healthcare roles<\/h1>\s*<p class="subtitle">[\s\S]*?<\/p>/,
        `<h1 id="pageTitle">Apply for remote healthcare roles</h1>
            <p class="subtitle">Tell us about your background. Your application is free and saved to our talent pool for global remote matching. No payment needed to submit.</p>`
    );
    h = h.replace(
        /Course access is delivered to this email after purchase\./,
        'We will use this email for application updates (and course access if you enrol later).'
    );
    h = h.replace(
        /Continue to certification/,
        'Submit free application'
    );
    h = h.replace(
        /btn\.innerHTML = 'Continue to certification[\s\S]*?';/,
        `btn.innerHTML = 'Submit free application <span class="iconify" data-icon="mdi:arrow-right"></span>';`
    );

    // Post-apply hook — interview inclusion, not "required cert"
    const offerRe = /<div id="screenOffer" class="screen">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\n\n<div id="site-footer">/;
    const offerHtml = `<div id="screenOffer" class="screen">
            <div style="display:inline-flex;align-items:center;gap:8px;background:#eff6ff;color:#1d4ed8;font-size:.78rem;font-weight:700;padding:6px 12px;border-radius:50px;margin-bottom:14px">APPLICATION RECEIVED ✓</div>
            <h1>Want to be included in interview shortlists?</h1>
            <p class="subtitle" id="offerSub">Your free application is saved. Here is how serious candidates get noticed faster.</p>
            <div class="offer">
                <h2>You are one step from standing out</h2>
                <p style="font-size:.92rem;color:#334155;margin-bottom:12px">Hiring partners get hundreds of CVs that look the same. Candidates who complete the <strong>Career Accelerator</strong> arrive interview-ready — video-consult skills, privacy awareness, and a remote-ready CV — so your application is far more likely to move into <strong>interview consideration</strong>.</p>
                <ul>
                    <li><strong>Priority for interview shortlists</strong> — show you are remote-ready, not just “interested”</li>
                    <li>8 modules: telehealth skills, privacy essentials, CV &amp; interview prep</li>
                    <li>Templates &amp; checklists used by candidates who convert applications into calls</li>
                    <li>Instant email access after checkout · lifetime portal</li>
                    <li>One-time from <strong>$27</strong> — less than a single missed opportunity</li>
                </ul>
                <div class="pricing">
                    <button type="button" class="price-card selected" data-product="standard" id="cardStandard">
                        <div style="font-weight:700;margin-bottom:4px">Standard</div>
                        <strong>$27</strong>
                        <span>Full course + templates</span>
                    </button>
                    <button type="button" class="price-card" data-product="pro" id="cardPro">
                        <div style="font-weight:700;margin-bottom:4px">Pro · Best for interviews</div>
                        <strong>$47</strong>
                        <span>Course + interview bank + LinkedIn kit</span>
                    </button>
                </div>
                <button type="button" class="btn btn-green btn-lg" id="purchaseBtn">
                    Unlock interview-ready access — $27
                </button>
                <p class="trust">Secure Paystack checkout · Instant email delivery · 30-day satisfaction policy</p>
            </div>
            <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center">
                <a href="jobs.html" class="btn btn-secondary">Back to jobs</a>
                <a href="course.html" class="btn btn-secondary">See full curriculum</a>
            </div>
        </div>
    </div>
</div>

<div id="site-footer">`;

    if (offerRe.test(h)) {
        h = h.replace(offerRe, offerHtml);
    } else {
        const a = h.indexOf('<div id="screenOffer"');
        const b = h.indexOf('<div id="site-footer">');
        if (a > 0 && b > a) {
            h = h.slice(0, a) + offerHtml + h.slice(b + '<div id="site-footer">'.length);
            // offerHtml already ends with site-footer open tag content issue - fix
            // Actually offerHtml includes <div id="site-footer"> so we should slice from after that marker's open
            h = h.slice(0, a) + offerHtml.replace(/<div id="site-footer">$/, '') + h.slice(b);
        }
    }

    h = h.replace(
        /document\.getElementById\('offerSub'\)\.textContent =\s*`[\s\S]*?`;/,
        `document.getElementById('offerSub').textContent =
            \`Great news, \${candidate.first_name} — your application is in. If you want this role to move toward interview shortlists, unlock the Career Accelerator next.\`;`
    );
    h = h.replace(
        /Complete Pro certification — \$47/g,
        'Unlock Pro interview pack — $47'
    );
    h = h.replace(
        /Complete mandatory certification — \$27/g,
        'Unlock interview-ready access — $27'
    );
    h = h.replace(
        /Get Pro access \(\$47\) — email delivery/g,
        'Unlock Pro interview pack — $47'
    );
    h = h.replace(
        /Get course access \(\$27\) — email delivery/g,
        'Unlock interview-ready access — $27'
    );

    write('apply.html', h);
}

// ---- index.html soft public copy ----
{
    let h = fs.readFileSync('index.html', 'utf8');
    h = h.replace(
        /<title>.*?<\/title>/,
        '<title>Remote Healthcare Jobs & Career Accelerator | RemoteMedicalJobs</title>'
    );
    h = h.replace(
        /<meta name="description" content="[^"]*">/,
        '<meta name="description" content="Find remote telehealth, nursing, pharmacy and digital health jobs worldwide. Apply free. Optional Career Accelerator ($27) helps you stand out for interviews — access emailed instantly.">'
    );
    h = h.replace(
        /Get certified\. Get Shortlisted\. Work Remote in Healthcare\./i,
        'Find Remote Healthcare Roles. Stand Out When It Counts.'
    );
    // hero h1 might be different
    h = h.replace(
        /Get <span class="highlight">Certified<\/span>\. Get Shortlisted\. Work Remote in Healthcare\./,
        'Your Hub for <span class="highlight">Remote Healthcare</span> Careers'
    );
    h = h.replace(
        /High-paying telehealth, nursing, pharmacy &amp; digital health roles worldwide\. Complete our Career Accelerator \(\$27\) — required to advance your application — and unlock instant email access to the full certification portal\./,
        'High-paying telehealth, nursing, pharmacy &amp; digital health roles worldwide. Apply free — then, when you want to be interview-ready, unlock the Career Accelerator with instant email access.'
    );
    h = h.replace(
        /Enrol &amp; Get Certified — \$27/,
        'Explore Career Accelerator'
    );
    h = h.replace(
        /Apply for Remote Roles/,
        'Browse &amp; Apply Free'
    );
    // pathway step 2
    h = h.replace(
        /<h3>Get certified \(\$27\)<\/h3>\s*<p>Complete the Remote Healthcare Career Accelerator — 8 modules covering consultations, privacy \(HIPAA\/GDPR-style\), scheduling, CVs, and interviews\. Portal link emailed the moment you pay\.<\/p>/,
        `<h3>Apply free to roles you want</h3>
                    <p>Browse curated openings and submit your profile at no cost. No payment barrier to explore jobs or start an application.</p>`
    );
    h = h.replace(
        /<h3>Submit your application<\/h3>\s*<p>Apply to featured remote roles or join our talent pool\. Certification is <strong>mandatory<\/strong> to advance applications to our placement desk and partner shortlists\.<\/p>/,
        `<h3>Show up interview-ready</h3>
                    <p>When you are serious about landing interviews, the Career Accelerator gives you telehealth skills, privacy confidence, and a remote-ready CV — so shortlisters notice you.</p>`
    );
    h = h.replace(
        /<h3>Get shortlisted &amp; hired<\/h3>\s*<p>Stand out with remote-ready skills employers actually screen for\. Browse live roles anytime — certified candidates move first\.<\/p>/,
        `<h3>Move into interviews</h3>
                    <p>Stand out with the skills remote employers actually screen for. Browse live roles anytime and use the Accelerator when you want a competitive edge.</p>`
    );
    // renumber pathway if needed - leave 1,2,3
    h = h.replace(
        /Start certification now — \$27/,
        'See the Career Accelerator'
    );
    h = h.replace(
        /Applications require Career Accelerator certification so partners receive remote-ready talent only\./,
        'Every role is curated. Apply free — unlock interview-ready training when you want to stand out.'
    );
    h = h.replace(/Apply · Cert Required/g, 'Apply Now');
    h = h.replace(
        /Get Certified — Then Apply/,
        'View All Remote Jobs'
    );
    // fix that CTA href back to jobs if it points to course
    h = h.replace(
        /href="course\.html" class="btn btn-primary btn-lg">\s*View All Remote Jobs/,
        'href="jobs.html" class="btn btn-primary btn-lg">\n                    View All Remote Jobs'
    );
    h = h.replace(
        /Stop Competing Unprepared\. Get Certified First\./,
        'Ready for remote healthcare work that fits your life?'
    );
    h = h.replace(
        /Remote healthcare employers shortlist candidates who already understand telehealth delivery, privacy, and remote professional standards\. The Career Accelerator is the mandatory gateway to advance your application — one payment, lifetime portal access, emailed instantly\./,
        'Browse roles and apply free. When you want interview shortlists to take you seriously, the Career Accelerator gives you telehealth skills, privacy confidence, and a polished remote profile — one payment, lifetime portal access, emailed instantly.'
    );
    h = h.replace(
        /Enrol Now — \$27/,
        'Explore the Accelerator'
    );
    h = h.replace(
        /Start Application/,
        'Apply Free'
    );

    // pathway section titles
    h = h.replace(
        /The Agency Pathway Top Candidates Follow/,
        'How ambitious candidates win remote roles'
    );
    h = h.replace(
        /Elite remote employers want applicants who already understand telehealth delivery, privacy standards, and remote professional presence\. Our three-step pathway is built like a high-performing placement agency — not a passive job board\./,
        'Browse opportunities, apply free, then level up with practical training when you are ready to compete for interviews — the same edge top remote candidates use.'
    );
    // Fix pathway card 1 number content - may have broken order. Read and fix pathway if first card still says Get certified
    h = h.replace(
        /Premium Remote Healthcare Placement Pathway/,
        'Global Remote Healthcare Careers'
    );

    // chatbot softer
    h = h.replace(
        /'job': "Browse our curated remote healthcare roles on the Jobs page\. To advance an application, complete the Career Accelerator certification \(\$27\) — it is required for placement shortlisting\. Enrol at the Course page\."/,
        `'job': "Browse curated remote healthcare roles on the Jobs page and apply free. After you apply, many candidates unlock the Career Accelerator ($27) to look interview-ready."`
    );
    h = h.replace(
        /'course': "The Career Accelerator is \$27 Standard or \$47 Pro\. You get 8 modules, templates, and instant email portal access\. Certification is required to advance job applications\."/,
        `'course': "The Career Accelerator is $27 Standard or $47 Pro — 8 modules, templates, and instant email portal access. Perfect after you apply when you want interview shortlists to notice you."`
    );
    h = h.replace(
        /'cert': "Yes — certification via the Career Accelerator is mandatory to advance applications to our placement desk\. Enrol in under 2 minutes at course\.html\."/,
        `'cert': "The Career Accelerator is optional to browse and apply. After you apply, it is the smart next step if you want to be interview-ready. Enrol in under 2 minutes on the Course page."`
    );
    h = h.replace(
        /'hello': "Welcome to RemoteMedicalJobs\. I can help with certification, applications, or employer hiring\. Most candidates start with the \$27 Career Accelerator\."/,
        `'hello': "Welcome to RemoteMedicalJobs. I can help with jobs, applications, or the Career Accelerator. Most people browse jobs first, then apply free."`
    );
    h = h.replace(
        /'hi': "Hi! Ready to get certified and apply for remote healthcare roles\? Ask me about the course, jobs, or pricing\."/,
        `'hi': "Hi! Looking for remote healthcare roles, or curious about the Career Accelerator? Ask me anything."`
    );

    write('index.html', h);
}

// ---- jobs ----
{
    let h = fs.readFileSync('jobs.html', 'utf8');
    h = h.replace(/Apply · Cert Required/g, 'Apply Now');
    h = h.replace(
        /Browse free — Career Accelerator certification \(\$27\) is required to advance your application\./,
        'Apply free to curated remote and hybrid roles. After you apply, unlock interview-ready training if you want a stronger shot at shortlists.'
    );
    h = h.replace(
        /Certification via the \$27 Career Accelerator is required to advance applications\./,
        'Apply free. Optional Career Accelerator helps you stand out for interviews.'
    );
    write('jobs.html', h);
}

// ---- course ----
{
    let h = fs.readFileSync('course.html', 'utf8');
    h = h.replace(
        /mandatory certification for job applications\./i,
        'practical certification for remote healthcare careers.'
    );
    h = h.replace(
        /Mandatory certification to advance job applications/,
        'Built for candidates who want interview-ready remote skills'
    );
    h = h.replace(
        /Required for application advancement/,
        'Instant email access after checkout'
    );
    h = h.replace(
        /Get Certified Now — \$27/,
        'Enrol Now — $27'
    );
    h = h.replace(
        /The agency-grade certification path for nurses, pharmacists, schedulers, coders, and digital health professionals who want remote roles — and need to prove they are telehealth-ready before shortlisting\./,
        'Practical training for nurses, pharmacists, schedulers, coders, and digital health professionals who want remote roles — and want to walk into interviews looking telehealth-ready.'
    );
    h = h.replace(
        /Required for Remote Job Applications \|/,
        '|'
    );
    write('course.html', h);
}

// ---- jobseekers ----
{
    let h = fs.readFileSync('jobseekers.html', 'utf8');
    h = h.replace(
        /Get Certified & Hired \|/,
        '|'
    );
    h = h.replace(
        /Mandatory \$27 Career Accelerator certification advances your applications worldwide\./,
        'Browse remote nursing, telehealth and digital health roles. Apply free. Unlock Career Accelerator training when you want to stand out for interviews.'
    );
    h = h.replace(
        /Browse curated roles, then complete the <strong>mandatory Career Accelerator certification \(\$27\)<\/strong> to advance applications to our placement desk\. Built like a premium agency funnel — not a free-for-all job board\./,
        'Search remote healthcare roles, apply free, and when you are serious about interviews, unlock the Career Accelerator ($27) for telehealth skills, privacy confidence, and a remote-ready CV.'
    );
    h = h.replace(
        /Viewing jobs is free\. Advancing an application requires certification\./,
        'Viewing jobs and applying is free. Training is available after you apply if you want an interview edge.'
    );
    h = h.replace(
        /High-conversion next steps/,
        'Recommended path'
    );
    h = h.replace(
        /1\. Get certified — from \$27/,
        '1. Career Accelerator — from $27'
    );
    h = h.replace(
        /8 modules, templates, email portal\. Mandatory to advance applications\./,
        '8 modules, templates, email portal. Ideal after you apply when interviews matter.'
    );
    h = h.replace(
        /2\. Submit application \+ certification path/,
        '2. Submit a free application'
    );
    h = h.replace(
        /Profile capture → secure checkout for Career Accelerator\./,
        'Tell us about your background — no payment to apply.'
    );
    h = h.replace(
        /Why certification is required/,
        'When candidates unlock the Accelerator'
    );
    h = h.replace(
        /Remote clinics lose money on candidates who are clinically strong but operationally unprepared\. Our Career Accelerator standardises telehealth skills, privacy awareness, and remote professional packaging — so when you apply, you look hire-ready from day one\./,
        'After you apply, the candidates who get interviews usually look remote-ready already. The Career Accelerator packages telehealth skills, privacy awareness, and a polished remote profile — so shortlisters take you seriously.'
    );
    h = h.replace(
        /Enrol in Career Accelerator →/,
        'See Career Accelerator →'
    );
    write('jobseekers.html', h);
}

// ---- about ----
{
    let h = fs.readFileSync('about.html', 'utf8');
    h = h.replace(
        /Mandatory \$27 Career Accelerator certification advances applications to telehealth employers worldwide\./,
        'Remote healthcare job board plus Career Accelerator training to help candidates stand out for interviews worldwide.'
    );
    h = h.replace(
        /Unlike passive job boards, we operate like a placement-focused agency: <strong>certification is mandatory to advance applications<\/strong>\. That protects employer partners and dramatically increases candidate competitiveness in a crowded remote market\./,
        'Unlike passive job boards, we combine curated roles with practical training. You can browse and apply free. When you want to compete for interviews, the Career Accelerator makes you look remote-ready.'
    );
    h = h.replace(
        /🎓 Mandatory Career Accelerator/,
        '🎓 Career Accelerator'
    );
    h = h.replace(
        /From \$27\. Eight practical modules \+ templates\. Access emailed instantly after secure payment\./,
        'From $27. Eight practical modules + templates. Access emailed instantly after secure payment — a smart step after you apply.'
    );
    h = h.replace(
        /⚡ Agency-grade funnel/,
        '⚡ Apply free, upgrade when ready'
    );
    h = h.replace(
        /Apply → certify → shortlist\. Built for conversion and quality, not empty applications\./,
        'Apply free → optional Accelerator → stronger interview profile. Built for real outcomes, not empty applications.'
    );
    h = h.replace(
        /We list vetted remote and hybrid healthcare opportunities and require the Career Accelerator for application advancement\. Course access is delivered by email with a private portal link\. We do not guarantee interviews, employment, visas, or salary outcomes — we equip you to compete at a professional standard\./,
        'We list curated remote and hybrid healthcare opportunities. Applying is free. The Career Accelerator is available when you want interview-ready skills; access is emailed with a private portal link. We do not guarantee interviews, employment, visas, or salary outcomes.'
    );
    h = h.replace(
        /Get certified — \$27 →/,
        'Career Accelerator →'
    );
    write('about.html', h);
}

// ---- landing, terms, privacy, compliance, contact ----
{
    let h = fs.readFileSync('landing.html', 'utf8');
    h = h.replace(
        /Mandatory Career Accelerator certification \(\$27\) to advance applications — access emailed after secure payment\./,
        'Optional Career Accelerator ($27) to look interview-ready after you apply — access emailed after secure payment.'
    );
    h = h.replace(
        /Browse roles, submit your profile, then complete the mandatory Career Accelerator certification — the same pathway serious remote candidates use to get shortlisted\. Training emailed instantly after Paystack checkout\./,
        'Browse roles and submit your profile free. When you want interview shortlists to notice you, unlock the Career Accelerator — training emailed instantly after Paystack checkout.'
    );
    h = h.replace(/Apply \+ get certified/, 'Apply free');
    write('landing.html', h);
}

{
    let h = fs.readFileSync('terms.html', 'utf8');
    h = h.replace(
        /You may browse job listings without purchase\. However, <strong>completing the Course \(Career Accelerator\) is required to advance a job application<\/strong> through our placement process\. Pricing is disclosed before checkout \(\$27 Standard \/ \$47 Pro\)\./,
        'You may browse job listings and submit applications without purchase. The Career Accelerator is an optional paid product that helps candidates prepare for remote interviews; pricing is disclosed before checkout ($27 Standard / $47 Pro). Completing the Course does not guarantee interviews or employment.'
    );
    write('terms.html', h);
}

{
    let h = fs.readFileSync('privacy.html', 'utf8');
    h = h.replace(
        /Completing the Course is required to advance job applications through our placement process\. /,
        ''
    );
    write('privacy.html', h);
}

{
    let h = fs.readFileSync('compliance.html', 'utf8');
    h = h.replace(
        /Included in the \$27 Career Accelerator — mandatory certification to advance job applications\./,
        'Included in the $27 Career Accelerator — practical training for remote healthcare professionals.'
    );
    h = h.replace(
        /a core reason certification is <strong>mandatory to advance job applications<\/strong> on RemoteMedicalJobs\. /,
        ''
    );
    h = h.replace(
        /Required to advance applications to our placement desk\./,
        'A smart step after you apply if you want interview confidence.'
    );
    h = h.replace(
        /Enrol &amp; get certified — \$27/,
        'See Career Accelerator — $27'
    );
    write('compliance.html', h);
}

{
    let h = fs.readFileSync('contact.html', 'utf8');
    h = h.replace(
        /Ready to enrol\? <a href="course\.html"[^>]*>Get certified for \$27 →<\/a>/,
        'Curious about training? <a href="course.html" style="color:#2563eb;font-weight:600">See the Career Accelerator →</a>'
    );
    write('contact.html', h);
}

// Verify no harsh public strings left
const harsh = [
    'Cert Required',
    'CERTIFICATION REQUIRED',
    'mandatory Career',
    'Mandatory',
    'required to advance',
    'must complete',
    'Get Certified'
];
for (const f of [
    'index.html',
    'apply.html',
    'jobs.html',
    'course.html',
    'jobseekers.html',
    'about.html',
    'landing.html',
    'js/chrome.js'
]) {
    const t = fs.readFileSync(f, 'utf8');
    for (const s of harsh) {
        if (t.includes(s) && !(f === 'course.html' && s === 'mandatory' && t.includes('scroll-snap-type:x mandatory'))) {
            // allow CSS mandatory keyword
            if (s === 'Mandatory' && t.includes('scroll-snap-type') && !t.match(/Mandatory [a-zA-Z]/)) continue;
            if (t.includes(s)) {
                // count excluding CSS
                const cleaned = t.replace(/scroll-snap-type:\s*x\s+mandatory/gi, '');
                if (cleaned.includes(s)) console.log('still has', JSON.stringify(s), 'in', f);
            }
        }
    }
}

console.log('done');
