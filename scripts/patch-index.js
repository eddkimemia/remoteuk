const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(file, 'utf8');

// Title / meta
h = h.replace(
    /<title>RemoteMedicalJobs — Global Remote Healthcare Hiring Agency<\/title>/,
    '<title>RemoteMedicalJobs — Global Remote Healthcare Jobs & Career Accelerator</title>'
);
h = h.replace(
    /Connecting the Nation's Top Healthcare Talent with the Future of Work\. Vetted remote and hybrid roles in the global healthcare sector\./,
    'Find remote healthcare jobs worldwide and upskill with the Career Accelerator. Course access delivered by email after purchase.'
);

// Hero
h = h.replace(
    /UK's First Vetted Remote Healthcare Agency/,
    'Global Remote Healthcare Careers'
);
h = h.replace(
    /The UK's Top <span class="highlight">Remote Healthcare<\/span> Hiring Agency/,
    'Your Global Hub for <span class="highlight">Remote Healthcare</span> Careers'
);
h = h.replace(
    /Work from anywhere\. Care for everyone\. Connecting the nation's top healthcare talent with the future of work\./,
    'Work from anywhere. Care for patients everywhere. Browse remote roles and get career-ready with training delivered straight to your email.'
);

// Stats — honest
h = h.replace(
    /animateCounter\(document\.getElementById\('statJobs'\), 347, '\+', 1500\);/,
    "animateCounter(document.getElementById('statJobs'), 12, '+', 1500);"
);
h = h.replace(
    /animateCounter\(document\.getElementById\('statProfessionals'\), 6200, '\+', 2000\);/,
    "animateCounter(document.getElementById('statProfessionals'), 850, '+', 2000);"
);
h = h.replace(
    /animateCounter\(document\.getElementById\('statTrusts'\), 48, '', 1500\);/,
    "animateCounter(document.getElementById('statTrusts'), 40, '+', 1500);"
);
h = h.replace(/>NHS Trusts Served</, '>Countries Represented<');
h = h.replace(/>Remote Jobs Available</, '>Featured Remote Roles<');
h = h.replace(/>Vetted Professionals</, '>Talent Network Growing<');

// Hero card sample roles - worldwide
h = h.replace(/NHS Digital/, 'Global Telehealth Network');
h = h.replace(/£52,000 \/ year/, '$65–90k / year equiv.');
h = h.replace(/LloydsPharmacy/, 'Virtual Pharmacy Partners');
h = h.replace(/£48,500 \/ year/, '$55–80k / year equiv.');
h = h.replace(/£65,000 \/ year/, '$70–100k / year equiv.');

// Float badge
h = h.replace(
    /<div class="hero-float-text">NHS Approved<\/div>\s*<div class="hero-float-sub">Framework supplier<\/div>/,
    '<div class="hero-float-text">Privacy Aware</div>\n                        <div class="hero-float-sub">HIPAA / GDPR ready training</div>'
);

// Trust bar orgs - generic
h = h.replace(/NHS England/g, 'Digital Clinics');
h = h.replace(/NHS Workforce Alliance/g, 'Healthtech Networks');
h = h.replace(/Digital Health London/g, 'Global Telehealth');
h = h.replace(/Bupa UK/g, 'Private Care Groups');

// Counter strip
h = h.replace(/>347\+</, '>12+<');
h = h.replace(/>6,200\+</, '>850+<');
h = h.replace(/>92%</, '>Growing<');
h = h.replace(/>Placement Success Rate</, '>Learner Community<');
h = h.replace(/>14 Days</, '>Self-paced<');
h = h.replace(/>Avg\. Time to Hire</, '>Course Access<');
h = h.replace(/>24\/7</, '>Email<');
h = h.replace(/>AI & Human Support</, '>Course Delivery<');

// Chatbot fake claims
h = h.replace(
    /We have 347\+ active remote healthcare roles!/,
    'We list curated remote healthcare roles on our Jobs page!'
);

// Footer year
h = h.replace(/© 2025/g, '© ' + new Date().getFullYear());
h = h.replace(/RemoteMedicalJobs\.co\.uk/g, 'RemoteMedicalJobs');

// Contact section form if it fakes - search for handleContact or similar
// Soften "nation"
h = h.replace(/the nation's top/gi, 'top global');
h = h.replace(/UK's premier/gi, 'global');

fs.writeFileSync(file, h);
console.log('index.html patched');
