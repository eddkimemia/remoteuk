/**
 * Course curriculum delivered after payment (email + portal).
 * Worldwide telehealth / remote healthcare focus.
 */

const PRODUCTS = {
    standard: {
        id: 'standard',
        name: 'Remote Healthcare Career Accelerator',
        amount: 27,
        description: 'Full 8-module telehealth career course + templates',
        features: ['8 video modules', 'CV template', 'Compliance quick-ref', 'Lifetime access']
    },
    pro: {
        id: 'pro',
        name: 'Career Accelerator Pro',
        amount: 47,
        description: 'Everything in Standard + priority job alerts + advanced interview kit',
        features: [
            'Everything in Standard',
            'Priority job-alert list',
            'Advanced interview answer bank',
            'LinkedIn profile checklist',
            'Priority support'
        ]
    }
};

const COURSE_MODULES = [
    {
        id: 1,
        title: 'Introduction to Global Remote Healthcare',
        duration: '25 min',
        summary: 'How telehealth markets work across US, UK, EU, Africa, LATAM & Asia. Role types, pay bands, and employer expectations.',
        lessons: [
            'The remote care economy explained',
            'Clinical vs non-clinical remote roles',
            'Where hiring is hottest right now'
        ]
    },
    {
        id: 2,
        title: 'Telehealth Consultation Skills',
        duration: '40 min',
        summary: 'Structure safe, effective video and phone consultations using SBAR and virtual bedside manner.',
        lessons: [
            'Virtual presence & rapport',
            'SBAR for remote handoffs',
            'Red flags and escalation'
        ]
    },
    {
        id: 3,
        title: 'Scheduling, Triage & Patient Coordination',
        duration: '35 min',
        summary: 'Master medical scheduling workflows used by remote clinics and RCM teams worldwide.',
        lessons: [
            'Appointment systems & no-show reduction',
            'Insurance vs private pathways (high level)',
            'Multi-timezone coordination'
        ]
    },
    {
        id: 4,
        title: 'Privacy & Compliance Essentials (HIPAA / GDPR / Global)',
        duration: '45 min',
        summary: 'Practical privacy rules for handling patient data remotely — US HIPAA, UK/EU GDPR, and common global standards.',
        lessons: [
            'PHI / PII basics',
            'Secure devices, networks & workspaces',
            'What employers audit for'
        ]
    },
    {
        id: 5,
        title: 'Digital Health Tools & Documentation',
        duration: '30 min',
        summary: 'EHR/EMR literacy, documentation quality, and tools every remote clinician should know.',
        lessons: [
            'EHR navigation patterns',
            'Clean clinical notes remotely',
            'Common telehealth platforms'
        ]
    },
    {
        id: 6,
        title: 'Remote-Ready CV & LinkedIn Makeover',
        duration: '35 min',
        summary: 'ATS-friendly CV structure and LinkedIn positioning for global remote healthcare roles.',
        lessons: [
            'Keywords that pass ATS',
            'Quantifying clinical impact',
            'Portfolio & certificates'
        ]
    },
    {
        id: 7,
        title: 'Interview Mastery for Remote Roles',
        duration: '40 min',
        summary: 'Behavioral + scenario interviews, tech setup, and how to demonstrate remote readiness.',
        lessons: [
            'STAR answers for clinical scenarios',
            'Home-office tech checklist',
            'Salary & contract negotiation basics'
        ]
    },
    {
        id: 8,
        title: 'Job Search System & 30-Day Action Plan',
        duration: '30 min',
        summary: 'A repeatable system to apply, follow up, and land interviews within 30 days.',
        lessons: [
            'Weekly outreach cadence',
            'Tracking applications',
            'When to upskill vs apply'
        ]
    }
];

const BONUS_RESOURCES = [
    {
        id: 'cv-template',
        title: 'Remote Healthcare CV Template',
        type: 'template',
        body: `REMOTE HEALTHCARE CV — TEMPLATE

[Full Name], [Credentials]
City, Country  |  Timezone  |  email@domain.com  |  WhatsApp  |  LinkedIn

PROFESSIONAL SUMMARY
Remote-ready [Nurse/Pharmacist/Coordinator] with X years of clinical experience. Skilled in telehealth consultations, secure documentation, and patient coordination across time zones. Seeking fully remote roles supporting global digital health teams.

CORE COMPETENCIES
• Telehealth consultation  • Clinical triage  • EHR documentation
• Patient scheduling  • HIPAA/GDPR awareness  • Multicultural communication
• Microsoft 365 / Google Workspace  • Video platforms (Zoom, Teams)

PROFESSIONAL EXPERIENCE
[Job Title] — [Employer], [Location] | [Dates]
• Achieved [metric] by [action]
• Delivered [remote-relevant] care / coordination for [volume] patients
• Collaborated with multidisciplinary teams using digital tools

EDUCATION & LICENSURE
• [Degree], [Institution], [Year]
• [License / Registration body], [Number], [Country]
• Remote Healthcare Career Accelerator — RemoteMedicalJobs (Year)

TECHNICAL
High-speed internet, quiet workspace, dual monitors (optional), webcam, headset`
    },
    {
        id: 'compliance-ref',
        title: 'Global Telehealth Compliance Quick Reference',
        type: 'guide',
        body: `TELEHEALTH COMPLIANCE — QUICK REFERENCE

1. NEVER share patient identifiers over personal WhatsApp/email without approved channels.
2. Use employer-approved devices/apps when required; enable full-disk encryption & screen lock.
3. Work in a private space; use headphones; avoid public Wi-Fi or use a trusted VPN.
4. Minimum necessary principle: access only data needed for your task.
5. Report suspected breaches immediately per employer policy.
6. Know your market rules:
   • US: HIPAA — protected health information (PHI)
   • UK/EU: UK GDPR / GDPR — special category health data
   • Others: follow local health privacy + employer SOPs
7. Document accurately; never falsify clinical notes.
8. Log out of EHR sessions; don't share passwords.
9. Keep CPD / license current in your practicing jurisdiction.
10. When unsure — escalate to clinical lead / compliance officer.`
    },
    {
        id: 'interview-checklist',
        title: 'Remote Interview Day Checklist',
        type: 'checklist',
        body: `REMOTE INTERVIEW CHECKLIST

24 hours before
□ Confirm time zone conversion
□ Test camera, mic, lighting
□ Update LinkedIn & CV links
□ Prepare 3 STAR clinical stories
□ Research employer telehealth model

1 hour before
□ Quiet room, neutral background
□ Water, notepad, charger
□ Close unrelated tabs/notifications
□ Join 5 minutes early

During
□ Smile, eye contact with camera
□ Use SBAR if clinical scenario given
□ Ask about training, KPIs, shift patterns, equipment stipend

After
□ Send thank-you email within 24h
□ Log outcome in application tracker`
    }
];

function getProduct(productId) {
    const id = (productId || 'standard').toLowerCase();
    return PRODUCTS[id] || PRODUCTS.standard;
}

function getAllProducts() {
    return PRODUCTS;
}

function getModules() {
    return COURSE_MODULES;
}

function getBonuses(productId) {
    const base = BONUS_RESOURCES.slice();
    if (productId === 'pro') {
        base.push({
            id: 'interview-bank',
            title: 'Pro: Advanced Interview Answer Bank',
            type: 'pro',
            body: `PRO INTERVIEW ANSWER BANK (SAMPLES)

Q: How do you handle a distressed patient over video?
A: I acknowledge emotion, ensure safety, use calm pacing, follow escalation protocol, document, and arrange appropriate follow-up.

Q: How do you protect privacy at home?
A: Private room, headphones, locked screen, no smart speakers recording, household informed not to enter, VPN if required.

Q: Describe a time you improved a process remotely.
A: Use STAR — Situation, Task, Action, Result with a measurable outcome (reduced no-shows, faster triage, etc.).`
        });
        base.push({
            id: 'linkedin-pro',
            title: 'Pro: LinkedIn Profile Checklist',
            type: 'pro',
            body: `LINKEDIN CHECKLIST FOR REMOTE HEALTHCARE
□ Headline: Role + Remote + Specialty (e.g. "RN | Telehealth | Chronic Care")
□ About: 3 paragraphs — who you help, proof, CTA
□ Experience bullets with metrics
□ Featured: certificate + CV PDF
□ Open to Work: remote worldwide (or preferred regions)
□ 10 connection notes/week to hiring managers`
        });
    }
    return base;
}

module.exports = {
    PRODUCTS,
    COURSE_MODULES,
    BONUS_RESOURCES,
    getProduct,
    getAllProducts,
    getModules,
    getBonuses
};
