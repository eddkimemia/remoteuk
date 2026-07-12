const fs = require('fs');

let html = fs.readFileSync('jobs.html', 'utf8');

// Truncate corrupted duplicate after first </html>
const firstClose = html.indexOf('</html>');
let head = html.slice(0, firstClose + '</html>'.length);
console.log('1 truncate', head.length, 'body', (head.match(/<\/body>/g) || []).length);

// Fix updateSalary by index surgery (more reliable than regex on broken quotes)
{
    const start = head.indexOf('function updateSalary()');
    const end = head.indexOf('function clearAllFilters()', start);
    if (start === -1 || end === -1) {
        console.error('Could not locate updateSalary/clearAllFilters');
        process.exit(1);
    }
    const fixed = `function updateSalary() {
    const v = document.getElementById('salaryRange').value;
    const el = document.getElementById('salaryValue');
    if (!el) return;
    el.textContent = (!v || v === '0') ? 'Any rate' : ('$' + v + '+ / hour');
}

`;
    head = head.slice(0, start) + fixed + head.slice(end);
    console.log('2 updateSalary', head.length, 'body', (head.match(/<\/body>/g) || []).length);
}

// Fix goPage by index
{
    const start = head.indexOf('function goPage(p)');
    const end = head.indexOf('function setView(', start);
    if (start === -1 || end === -1) {
        console.error('Could not locate goPage/setView');
        process.exit(1);
    }
    const fixed = `function goPage(p) {
    currentPage = p;
    filterJobs();
    window.scrollTo({ top: 340, behavior: 'smooth' });
}

`;
    head = head.slice(0, start) + fixed + head.slice(end);
    console.log('3 goPage', head.length, 'body', (head.match(/<\/body>/g) || []).length);
}

// Prefill at init
if (!head.includes("params.get('q')") || !head.includes('// ===== INIT =====')) {
    // ok
}
{
    const marker = '// ===== INIT =====\r\nfilterJobs();';
    const marker2 = '// ===== INIT =====\nfilterJobs();';
    if (head.includes(marker) || head.includes(marker2)) {
        const use = head.includes(marker) ? marker : marker2;
        const prefill = `// ===== INIT =====
(function () {
    try {
        const params = new URLSearchParams(location.search);
        const q = params.get('q');
        if (q) {
            const el = document.getElementById('mainSearch');
            if (el) el.value = q;
        }
    } catch (e) {}
})();
filterJobs();`;
        head = head.replace(use, prefill);
        console.log('4 prefill', head.length);
    } else {
        console.log('4 prefill skipped (marker missing)');
    }
}

// Replace nav by index markers
{
    const start = head.indexOf('<!-- NAV -->');
    const end = head.indexOf('<!-- JOBS HERO -->');
    if (start === -1 || end === -1) {
        console.error('nav markers missing', start, end);
        process.exit(1);
    }
    head =
        head.slice(0, start) +
        '<div id="site-header" data-active="jobs" data-pad="false"></div>\n\n' +
        head.slice(end);
    console.log('5 nav', head.length, 'body', (head.match(/<\/body>/g) || []).length);
}

// Replace footer by index markers
{
    const start = head.indexOf('<!-- ===== FOOTER ===== -->');
    const appModal = head.indexOf('<!-- APPLICATION MODAL -->');
    if (start === -1 || appModal === -1) {
        console.error('footer markers missing', start, appModal);
        process.exit(1);
    }
    head =
        head.slice(0, start) +
        '<div id="site-footer"></div>\n<script src="/js/chrome.js"></script>\n\n' +
        head.slice(appModal);
    console.log('6 footer', head.length, 'body', (head.match(/<\/body>/g) || []).length);
}

// Soft guards
head = head.replace(/mobileToggle\.addEventListener\('click'/g, "mobileToggle && mobileToggle.addEventListener('click'");
head = head.replace(/(?<!&&)mobileMenu\.classList/g, 'mobileMenu && mobileMenu.classList');
head = head.replace(/(?<!&&)menuIcon\.setAttribute/g, 'menuIcon && menuIcon.setAttribute');
head = head.replace(
    /window\.addEventListener\('scroll', \(\) => document\.getElementById\('nav'\)\.classList\.toggle\('scrolled', window\.scrollY > 20\)\);/g,
    `window.addEventListener('scroll', () => {
    const n = document.getElementById('nav');
    if (n) n.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });`
);
console.log('7 guards', head.length, 'body', (head.match(/<\/body>/g) || []).length);

const stats = {
    body: (head.match(/<\/body>/g) || []).length,
    html: (head.match(/<\/html>/g) || []).length,
    chrome: head.includes('/js/chrome.js'),
    header: head.includes('site-header'),
    footer: head.includes('site-footer'),
    anyRate: head.includes('Any rate'),
    mobile: (head.match(/MOBILE MENU/g) || []).length
};
console.log(stats);

if (stats.body !== 1 || stats.html !== 1 || !stats.chrome || !stats.header) {
    console.error('validation failed');
    process.exit(1);
}

fs.writeFileSync('jobs.html', head.endsWith('\n') ? head : head + '\n');
console.log('jobs.html repaired OK');
