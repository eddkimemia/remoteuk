const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(file, 'utf8');

h = h.replace(
    /From NHS Trusts reducing agency spend to digital health start-ups scaling fast — we deliver vetted remote talent on demand\./,
    'From digital clinics to healthtech start-ups scaling globally — we help teams hire remote-ready healthcare talent.'
);
h = h.replace(
    /An NHS Trust in the North West replaced 40% of agency locums with our remote telehealth nurses, reducing spend by £2\.4M while maintaining patient satisfaction scores above 90%\./,
    'A multi-site virtual care group reduced contractor spend by shifting triage and follow-up work to trained remote nurses — while keeping patient satisfaction scores high.'
);
h = h.replace(/Telehealth Nurse — NHS Digital/g, 'Telehealth Nurse — Global Virtual Care');
h = h.replace(/Workforce Director — NHS Trust/g, 'Workforce Director — Regional Care Network');
h = h.replace(
    /We've helped NHS Trusts save up to £2\.4M annually\. Shall I connect you with our team\?/,
    "We help digital clinics and care groups hire remote talent. Shall I connect you with our team via the contact form?"
);
h = h.replace(
    /Locum & Perm Staffing \(6,200\+ vetted professionals\)/,
    'Locum & Perm Staffing (growing global talent pool)'
);
h = h.replace(/nmc': "Great question about NMC compliance![\s\S]*?",/,
    `'nmc': "Registration rules depend on your country and employer (e.g. NMC in the UK, state boards in the US). Our course covers multi-market privacy and remote readiness — check Compliance and Course pages for details.",`
);

fs.writeFileSync(file, h);
console.log('index employer claims softened');
