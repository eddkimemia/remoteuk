/**
 * One-shot patcher: inject shared chrome placeholders + chrome.js,
 * fix common broken anchors, unify contact email.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const PAGES = [
    { file: 'index.html', active: 'home', pad: false, fullBleed: true },
    { file: 'jobs.html', active: 'jobs', pad: false },
    { file: 'course.html', active: 'course', pad: false },
    { file: 'apply.html', active: 'apply', pad: true },
    { file: 'contact.html', active: 'contact', pad: true },
    { file: 'success.html', active: 'success', pad: true },
    { file: 'about.html', active: 'about', pad: true },
    { file: 'jobseekers.html', active: 'jobseekers', pad: true },
    { file: 'compliance.html', active: 'compliance', pad: true },
    { file: 'privacy.html', active: '', pad: true },
    { file: 'terms.html', active: '', pad: true },
    { file: 'landing.html', active: '', pad: true, isLanding: true }
];

function ensureHeadAssets(html) {
    let out = html;
    if (!/iconify\.min\.js/.test(out)) {
        out = out.replace(
            '</head>',
            '    <script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>\n</head>'
        );
    }
    if (!/href="\/style\.css"|href="style\.css"/.test(out)) {
        out = out.replace(
            '</head>',
            '    <link rel="stylesheet" href="/style.css">\n</head>'
        );
    }
    return out;
}

function ensureChromeScript(html) {
    if (/js\/chrome\.js/.test(html)) return html;
    // Insert before last closing body
    return html.replace(
        /<\/body>\s*<\/html>\s*$/i,
        '    <script src="/js/chrome.js"></script>\n</body>\n</html>\n'
    );
}

function stripExistingNav(html) {
    // Remove <nav class="nav" ...>...</nav> and following mobile menu
    let out = html;

    // Pattern A: full nav with optional mobile menu
    out = out.replace(
        /<!--\s*={2,}.*?NAVIGATION.*?={2,}\s*-->\s*/i,
        ''
    );
    out = out.replace(
        /<nav\b[^>]*class="[^"]*\bnav\b[^"]*"[^>]*>[\s\S]*?<\/nav>\s*/i,
        '___NAV_REMOVED___'
    );
    // Only one replacement flag - re-run if multiple
    while (/<nav\b[^>]*class="[^"]*\bnav\b[^"]*"[^>]*>[\s\S]*?<\/nav>/i.test(out)) {
        out = out.replace(/<nav\b[^>]*class="[^"]*\bnav\b[^"]*"[^>]*>[\s\S]*?<\/nav>\s*/i, '');
    }
    out = out.replace('___NAV_REMOVED___', '');

    // Mobile menus that sit right after nav
    out = out.replace(
        /<!--\s*Mobile Menu\s*-->\s*<div class="mobile-menu"[\s\S]*?<\/div>\s*/i,
        ''
    );
    out = out.replace(
        /<div class="mobile-menu"[^>]*id="mobileMenu"[^>]*>[\s\S]*?<\/div>\s*/i,
        ''
    );

    // Simple div.nav headers (about/jobseekers/compliance/privacy/terms)
    out = out.replace(
        /<div class="nav"[^>]*>[\s\S]*?<\/div>\s*(?=<div class="wrap|<div class="doc|<section|<div class="container"|<div class="top"|<!--)/i,
        ''
    );

    return out;
}

function stripExistingFooter(html) {
    let out = html;
    out = out.replace(/<!--\s*={2,}.*?FOOTER.*?={2,}\s*-->\s*/i, '');
    out = out.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>\s*/i, '');
    // Minimal div.footer on contact/success
    out = out.replace(
        /<div class="footer"[^>]*>[\s\S]*?<\/div>\s*(?=<div class="toast|<script|<!--|<\/body>)/i,
        ''
    );
    return out;
}

function injectChrome(html, { active, pad }) {
    const header =
        `<div id="site-header" data-active="${active || ''}" data-pad="${pad ? 'true' : 'false'}"></div>\n`;
    const footer = `<div id="site-footer"></div>\n`;

    let out = html;
    // After <body...>
    if (!/id="site-header"/.test(out)) {
        out = out.replace(/<body([^>]*)>/i, `<body$1>\n${header}`);
    }
    if (!/id="site-footer"/.test(out)) {
        // Before chat bot / toast / first script near end, prefer before last script blocks
        if (/<!--\s*={2,}.*?CHAT/i.test(out)) {
            out = out.replace(/<!--\s*={2,}.*?CHAT/i, footer + '    <!-- ===== CHAT');
        } else if (/<div class="toast"/i.test(out)) {
            out = out.replace(/<div class="toast"/i, footer + '<div class="toast"');
        } else if (/<script>/i.test(out) && /<\/body>/i.test(out)) {
            // insert footer before the last script group near body end
            const idx = out.lastIndexOf('<script');
            if (idx > 0) {
                out = out.slice(0, idx) + footer + out.slice(idx);
            } else {
                out = out.replace(/<\/body>/i, footer + '</body>');
            }
        } else {
            out = out.replace(/<\/body>/i, footer + '</body>');
        }
    }
    return out;
}

function fixIndexLinks(html) {
    let out = html;
    out = out.replace(/href="#contact"/g, 'href="contact.html"');
    out = out.replace(/href="#seekers"/g, 'href="jobs.html"');
    out = out.replace(/href="#about"/g, 'href="about.html"');
    out = out.replace(/href="#compliance"/g, 'href="compliance.html"');
    // "View All Remote Jobs" should go to jobs
    out = out.replace(
        /href="jobs\.html" class="btn btn-primary btn-lg">\s*View All Remote Jobs/i,
        'href="jobs.html" class="btn btn-primary btn-lg">\n                    View All Remote Jobs'
    );
    return out;
}

function fixCourseEmail(html) {
    return html.replace(/hello@remotemedicaljobs\.co\.uk/gi, 'hello@remotemedicaljobs.com');
}

function softNullGuards(html) {
    // Prevent double-binding crashes if elements missing; leave existing code mostly intact
    return html;
}

function patchLanding(html) {
    let out = ensureHeadAssets(html);
    out = injectChrome(out, { active: '', pad: true });
    out = ensureChromeScript(out);
    return out;
}

function patchPage(cfg) {
    const filePath = path.join(root, cfg.file);
    let html = fs.readFileSync(filePath, 'utf8');

    if (cfg.isLanding) {
        html = patchLanding(html);
        fs.writeFileSync(filePath, html);
        console.log('Patched', cfg.file);
        return;
    }

    html = ensureHeadAssets(html);
    html = stripExistingNav(html);
    html = stripExistingFooter(html);
    html = injectChrome(html, cfg);
    html = ensureChromeScript(html);
    html = fixCourseEmail(html);

    if (cfg.file === 'index.html') {
        html = fixIndexLinks(html);
    }
    if (cfg.file === 'jobs.html') {
        html = html.replace(/href="index\.html#about"/g, 'href="about.html"');
        html = html.replace(/href="index\.html#employers"/g, 'href="index.html#employers"');
        // Soften UK-only blurb if still present outside footer (footer was stripped)
        html = html.replace(/The UK's premier vetted remote healthcare hiring agency\./g,
            'Connecting healthcare talent with remote roles worldwide.');
    }

    // Defensive: page scripts that bind mobile menu
    html = html.replace(
        /const mobileToggle = document\.getElementById\('mobileToggle'\);/g,
        "const mobileToggle = document.getElementById('mobileToggle'); /* chrome.js also wires this */"
    );

    fs.writeFileSync(filePath, html);
    console.log('Patched', cfg.file);
}

// Expand thin about page content slightly while keeping structure
function expandAbout() {
    const filePath = path.join(root, 'about.html');
    let html = fs.readFileSync(filePath, 'utf8');
    // Only expand if still short
    if (html.includes('Who we are') || html.includes('What we offer')) return;
    // leave as-is if already expanded by chrome patch content
}

for (const p of PAGES) {
    try {
        patchPage(p);
    } catch (e) {
        console.error('Failed', p.file, e.message);
        process.exitCode = 1;
    }
}

console.log('Done.');
