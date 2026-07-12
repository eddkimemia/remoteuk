const fs = require('fs');
const path = require('path');

const files = [
    'index.html',
    'jobs.html',
    'course.html',
    'apply.html',
    'contact.html',
    'success.html',
    'about.html',
    'jobseekers.html',
    'compliance.html',
    'privacy.html',
    'terms.html',
    'landing.html'
];

for (const f of files) {
    let html = fs.readFileSync(f, 'utf8');

    // Remove all chrome.js script tags
    html = html.replace(/\s*<script\s+src="\/js\/chrome\.js"><\/script>\s*/g, '\n');

    // Insert chrome.js immediately after site-footer mount
    if (!html.includes('id="site-footer"')) {
        console.error('NO FOOTER', f);
        continue;
    }
    html = html.replace(
        /(<div id="site-footer"><\/div>)/,
        '$1\n    <script src="/js/chrome.js"></script>'
    );

    // Guard nav scroll
    html = html.replace(
        /const nav = document\.getElementById\('nav'\);\s*window\.addEventListener\('scroll',\s*\(\)\s*=>\s*\{\s*nav\.classList\.toggle\('scrolled',\s*window\.scrollY > 20\);\s*\}\);/g,
        `const nav = document.getElementById('nav');
        if (nav) {
            window.addEventListener('scroll', () => {
                nav.classList.toggle('scrolled', window.scrollY > 20);
            }, { passive: true });
        }`
    );

    // Guard mobileToggle.addEventListener
    html = html.replace(
        /(?<!&& )mobileToggle\.addEventListener\(/g,
        'mobileToggle && mobileToggle.addEventListener('
    );

    // Guard mobileMenu.classList usages carefully
    html = html.replace(
        /(?<!mobileMenu && )(?<!if \(mobileMenu\) )mobileMenu\.classList/g,
        'mobileMenu && mobileMenu.classList'
    );

    // Fix menuIcon if present without guard when used after toggle
    html = html.replace(
        /menuIcon\.setAttribute\(/g,
        'menuIcon && menuIcon.setAttribute('
    );

    fs.writeFileSync(f, html);
    console.log('fixed', f);
}

console.log('done');
