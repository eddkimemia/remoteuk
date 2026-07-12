const fs = require('fs');
let h = fs.readFileSync('jobs.html', 'utf8');
const i = h.indexOf('</html>');
h = h.slice(0, i + 7);
console.log('start', h.length);

const navRe =
    /<!-- NAV -->\s*<nav class="nav" id="nav">[\s\S]*?<\/nav>\s*<!-- Mobile Menu -->\s*<div class="mobile-menu" id="mobileMenu">[\s\S]*?<\/div>\s*/i;
const m = h.match(navRe);
console.log('nav match', !!m, 'len', m ? m[0].length : 0);
if (m) console.log('nav end snippet', JSON.stringify(m[0].slice(-60)));

const footRe =
    /<!-- ===== FOOTER ===== -->\s*<footer class="footer"[\s\S]*?<\/footer>\s*(?:<style>[\s\S]*?<\/style>\s*)?/i;
const f = h.match(footRe);
console.log('foot match', !!f, 'len', f ? f[0].length : 0);
if (f) {
    console.log('foot has body?', f[0].includes('</body>'));
    console.log('foot end', JSON.stringify(f[0].slice(-120)));
    console.log('foot start', JSON.stringify(f[0].slice(0, 80)));
}

// How many footers/navs
console.log('footer tags', (h.match(/<footer/g) || []).length);
console.log('nav tags', (h.match(/<nav /g) || []).length);
console.log('mobile-menu', (h.match(/mobile-menu/g) || []).length);
