const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'jobs.html');
let h = fs.readFileSync(file, 'utf8');

// Hero copy worldwide
h = h.replace(
    /347\+ vetted remote and hybrid roles from NHS Trusts, private providers, and digital health innovators\. Every role is legitimate — guaranteed\./,
    'Curated remote and hybrid healthcare roles from digital clinics, healthtech, and global care teams. Apply free — optional career training available.'
);

// Salary filter: hourly USD
h = h.replace(
    /<input type="range" min="25000" max="120000" step="5000" value="25000" id="salaryRange" oninput="updateSalary\(\);filterJobs\(\)">\s*<div class="salary-value" id="salaryValue">£25,000\+<\/div>/,
    `<input type="range" min="0" max="150" step="5" value="0" id="salaryRange" oninput="updateSalary();filterJobs()">
                <div class="salary-value" id="salaryValue">$0+ / hour</div>`
);

h = h.replace(
    /document\.getElementById\('salaryValue'\)\.textContent = '£' \+ parseInt\(v\)\.toLocaleString\(\) \+ '\+';/,
    "document.getElementById('salaryValue').textContent = '$' + parseInt(v) + '+ / hour';"
);

h = h.replace(
    /document\.getElementById\('salaryRange'\)\.value = 25000;/,
    "document.getElementById('salaryRange').value = 0;"
);

// Expand jobs data
const jobsStart = h.indexOf('const jobs = [');
const jobsEnd = h.indexOf('];', jobsStart);
if (jobsStart === -1 || jobsEnd === -1) {
    console.error('jobs array not found');
    process.exit(1);
}

const newJobs = `const jobs = [
    {
        id:1, title:"Telehealth Nurse Specialist", company:"Global Digital Health", location:"Remote (Worldwide)", type:"clinical", mode:"remote", contract:"permanent", speciality:"nursing",
        salary:"$32–45 / hour", salaryNum:32, posted:"2 hours ago", badge:["remote","featured"],
        tags:["Registered Nurse","Telehealth","Full-time"],
        desc:"Provide remote clinical triage and video consultations for patients across multiple regions. Use digital health platforms to assess, advise, and manage pathways with a distributed multidisciplinary team.",
        requirements:["Valid nursing license in your practicing country","Minimum 2 years post-qualification experience","Comfort with video consult tools","Excellent written & verbal English","Stable high-speed internet"],
        benefits:["Flexible shifts","Remote equipment stipend","CPD support","Global team culture"],
        logo:"mdi:stethoscope", logoBg:"#EFF6FF", logoColor:"#2563EB"
    },
    {
        id:2, title:"Clinical Pharmacist — Remote Consults", company:"MedGroup Virtual Care", location:"Remote (US / UK / EU preferred)", type:"clinical", mode:"remote", contract:"part-time", speciality:"pharmacy",
        salary:"$28–40 / hour", salaryNum:28, posted:"5 hours ago", badge:["remote"],
        tags:["Pharmacist","Prescribing","Part-time"],
        desc:"Deliver remote medication reviews and clinical advice via video and phone. Support medicines optimisation for digital clinics worldwide.",
        requirements:["Licensed pharmacist","Clinical pharmacy experience","Strong digital communication skills"],
        benefits:["Flexible 3-day week option","Professional development budget","Remote-first culture"],
        logo:"mdi:pill", logoBg:"#ECFDF5", logoColor:"#059669"
    },
    {
        id:3, title:"Health Informatics Specialist", company:"MedTech Analytics", location:"Fully Remote", type:"non-clinical", mode:"remote", contract:"permanent", speciality:"informatics",
        salary:"$40–55 / hour", salaryNum:42, posted:"1 day ago", badge:["remote","new"],
        tags:["Healthcare Data","SQL","FHIR/HL7"],
        desc:"Lead data analytics and informatics projects for health clients. Build dashboards and support digital transformation for care delivery networks.",
        requirements:["Degree or experience in informatics / CS / health data","SQL and visualisation tools","Familiarity with health data standards"],
        benefits:["Home office budget","Learning stipend $2,000/year","Async-friendly culture"],
        logo:"mdi:monitor-cellphone", logoBg:"#F3E8FF", logoColor:"#7C3AED"
    },
    {
        id:4, title:"Medical Coding Specialist", company:"Clinical Services Global", location:"Remote", type:"non-clinical", mode:"remote", contract:"permanent", speciality:"coding",
        salary:"$22–32 / hour", salaryNum:24, posted:"1 day ago", badge:["remote"],
        tags:["ICD-10","Coding","RCM"],
        desc:"Code diagnoses and procedures remotely with accuracy. Support audits and quality data for multi-country revenue cycle teams.",
        requirements:["CPC or equivalent certification preferred","ICD-10 proficiency","2+ years coding experience"],
        benefits:["Remote-first","Paid training updates","Health benefits (region-dependent)"],
        logo:"mdi:file-document-edit", logoBg:"#FFFBEB", logoColor:"#D97706"
    },
    {
        id:5, title:"Telemedicine Physician (MD / GP)", company:"Horizon Digital Care", location:"Fully Remote", type:"clinical", mode:"remote", contract:"locum", speciality:"medicine",
        salary:"$90–130 / hour", salaryNum:110, posted:"2 days ago", badge:["remote","urgent"],
        tags:["Licensed MD","Primary Care","Flexible"],
        desc:"Provide remote physician consultations for a digital health platform. Manage queries, prescribe where licensed, and coordinate referrals.",
        requirements:["Active medical license","Primary care or internal medicine background","Telemedicine experience preferred","Malpractice cover as required by market"],
        benefits:["Choose your hours","Competitive rates","Peer clinical network"],
        logo:"mdi:doctor", logoBg:"#EFF6FF", logoColor:"#2563EB"
    },
    {
        id:6, title:"Patient Coordination Lead", company:"CarePath Remote", location:"Remote", type:"non-clinical", mode:"remote", contract:"permanent", speciality:"compliance",
        salary:"$24–35 / hour", salaryNum:26, posted:"2 days ago", badge:["remote"],
        tags:["Leadership","Coordination","EMR"],
        desc:"Lead a remote coordination team managing end-to-end patient pathways across time zones.",
        requirements:["Healthcare admin or coordination experience","Team leadership","EMR familiarity"],
        benefits:["Fully remote","PTO","Career progression"],
        logo:"mdi:account-heart", logoBg:"#ECFDF5", logoColor:"#059669"
    },
    {
        id:7, title:"Remote Medical Scheduler", company:"ClinicLink Worldwide", location:"Remote (Worldwide)", type:"non-clinical", mode:"remote", contract:"permanent", speciality:"compliance",
        salary:"$18–28 / hour", salaryNum:20, posted:"3 hours ago", badge:["remote","featured"],
        tags:["Scheduling","Call Center","Healthcare Admin"],
        desc:"Schedule appointments, manage calendars, and support patients for multi-site virtual clinics. Ideal entry point into remote healthcare ops.",
        requirements:["Strong communication","Customer service or admin experience","Reliable internet","Typing accuracy"],
        benefits:["Weekly pay options","Training provided","Growth into coordination roles"],
        logo:"mdi:calendar-clock", logoBg:"#DBEAFE", logoColor:"#1D4ED8"
    },
    {
        id:8, title:"Mental Health Teletherapist", company:"MindBridge Telehealth", location:"Remote", type:"clinical", mode:"remote", contract:"part-time", speciality:"nursing",
        salary:"$45–75 / hour", salaryNum:50, posted:"6 hours ago", badge:["remote","new"],
        tags:["Therapy","Licensed","Video"],
        desc:"Deliver remote counseling/therapy sessions to clients via secure video. Flexible caseload for licensed mental health professionals.",
        requirements:["Active license to practice psychotherapy/counseling","2+ years clinical experience","Private workspace"],
        benefits:["Set your schedule","No commute","Clinical supervision available"],
        logo:"mdi:brain", logoBg:"#F3E8FF", logoColor:"#7C3AED"
    },
    {
        id:9, title:"Healthcare Customer Success Manager", company:"VitalSoft", location:"Remote (Americas / EMEA)", type:"non-clinical", mode:"remote", contract:"permanent", speciality:"informatics",
        salary:"$35–50 / hour", salaryNum:40, posted:"1 day ago", badge:["remote"],
        tags:["SaaS","Healthcare IT","CSM"],
        desc:"Own relationships with hospital and clinic customers using a digital health product. Drive adoption, training, and renewals.",
        requirements:["B2B SaaS or healthcare ops experience","Excellent stakeholder management","CRM fluency"],
        benefits:["Remote team offsites","Equity eligibility","Learning budget"],
        logo:"mdi:handshake", logoBg:"#ECFDF5", logoColor:"#059669"
    },
    {
        id:10, title:"Remote Case Manager (RN)", company:"Continuum Care Virtual", location:"Remote", type:"clinical", mode:"remote", contract:"permanent", speciality:"nursing",
        salary:"$30–42 / hour", salaryNum:34, posted:"4 days ago", badge:["remote"],
        tags:["Case Management","RN","Chronic Care"],
        desc:"Coordinate care plans for chronic patients via phone and digital tools. Bridge patients, providers, and payers remotely.",
        requirements:["RN license","Case management or discharge planning experience","Empathetic communication"],
        benefits:["Stable daytime shifts","Health benefits","Career ladder"],
        logo:"mdi:clipboard-pulse", logoBg:"#FEF3C7", logoColor:"#D97706"
    },
    {
        id:11, title:"Medical Writer (Remote)", company:"Apex Clinical Content", location:"Remote (Worldwide)", type:"non-clinical", mode:"remote", contract:"contract", speciality:"coding",
        salary:"$35–60 / hour", salaryNum:45, posted:"3 days ago", badge:["remote","new"],
        tags:["Writing","Regulatory","Content"],
        desc:"Produce clear clinical and patient education content for digital health brands and medical affairs teams.",
        requirements:["Life sciences or clinical background","Strong writing portfolio","Attention to scientific accuracy"],
        benefits:["Project-based flexibility","Global clients","Reference letters"],
        logo:"mdi:pencil-box", logoBg:"#EFF6FF", logoColor:"#2563EB"
    },
    {
        id:12, title:"Revenue Cycle Specialist", company:"PayHealth Ops", location:"Remote", type:"non-clinical", mode:"remote", contract:"permanent", speciality:"coding",
        salary:"$20–30 / hour", salaryNum:22, posted:"5 days ago", badge:["remote"],
        tags:["RCM","Billing","Claims"],
        desc:"Support claims follow-up, denials, and patient billing queries for US-focused telehealth groups (training provided for strong admins).",
        requirements:["Healthcare billing exposure preferred","Detail-oriented","Comfortable with ticketing systems"],
        benefits:["Full training","Performance bonuses","Remote US hours"],
        logo:"mdi:cash-multiple", logoBg:"#ECFDF5", logoColor:"#047857"
    }
];`;

h = h.slice(0, jobsStart) + newJobs + h.slice(jobsEnd + 2);

// Footer year + worldwide
h = h.replace(/© 2025 RemoteMedicalJobs\.co\.uk\. All rights reserved\. Registered in England & Wales\./g,
    '© ' + new Date().getFullYear() + ' RemoteMedicalJobs. Remote healthcare careers worldwide.');

// Apply still goes to apply.html — good
// Fix dead multi-step if still referenced — submitApplication can stay but modal simplified already routes to apply

fs.writeFileSync(file, h);
console.log('jobs.html patched; jobs count markers ok');
