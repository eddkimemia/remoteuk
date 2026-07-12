const fs = require('fs');

// Guard year setters
for (const f of ['apply.html', 'contact.html', 'success.html']) {
    let html = fs.readFileSync(f, 'utf8');
    html = html.replace(
        /document\.getElementById\('y'\)\.textContent = new Date\(\)\.getFullYear\(\);/g,
        "const _y = document.getElementById('y'); if (_y) _y.textContent = new Date().getFullYear();"
    );
    fs.writeFileSync(f, html);
    console.log('year guard', f);
}

// Guard nav scroll in jobs (appears twice possibly)
{
    let html = fs.readFileSync('jobs.html', 'utf8');
    html = html.replace(
        /window\.addEventListener\('scroll', \(\) => document\.getElementById\('nav'\)\.classList\.toggle\('scrolled', window\.scrollY > 20\)\);/g,
        `window.addEventListener('scroll', () => {
    const n = document.getElementById('nav');
    if (n) n.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });`
    );

    // Check for duplicate const mobileToggle in same script - would be SyntaxError
    const scripts = [];
    const re = /<script>([\s\S]*?)<\/script>/g;
    let m;
    while ((m = re.exec(html))) scripts.push(m[1]);
    console.log('jobs.html inline scripts:', scripts.length);
    scripts.forEach((s, i) => {
        const mobileCount = (s.match(/const mobileToggle/g) || []).length;
        const jobsCount = (s.match(/const jobs\s*=/g) || []).length;
        console.log(`  script[${i}] mobileToggle×${mobileCount} jobs×${jobsCount} len=${s.length}`);
    });

    // If one script has mobileToggle twice, remove the second block
    html = html.replace(
        /(\/\/ ===== MOBILE MENU =====[\s\S]*?document\.body\.style\.overflow = '';\s*\}\)\);\s*\/\/ ===== NAV SCROLL =====[\s\S]*?\{ passive: true \}\);\s*)([\s\S]*?)(\/\/ ===== MOBILE MENU =====[\s\S]*?\{ passive: true \}\);)/,
        (match, first, middle, second) => {
            console.log('Removing duplicate mobile menu block in jobs.html');
            return first + middle;
        }
    );

    fs.writeFileSync('jobs.html', html);
}

// Fix apply/contact/success double top spacing: use pad false when they have own margin
for (const f of ['apply.html', 'contact.html', 'success.html']) {
    let html = fs.readFileSync(f, 'utf8');
    html = html.replace(/data-pad="true"/, 'data-pad="false"');
    fs.writeFileSync(f, html);
    console.log('pad false', f);
}

// jobseekers: pass location as q hint if present
{
    let html = fs.readFileSync('jobseekers.html', 'utf8');
    html = html.replace(
        /document\.getElementById\('searchBtn'\)\.addEventListener\('click', \(\)=>\{\s*const q = document\.getElementById\('q'\)\.value\.trim\(\);\s*const url = 'jobs\.html' \+ \(q \? \('\?q=' \+ encodeURIComponent\(q\)\) : ''\);\s*location\.href = url;\s*\}\);/,
        `document.getElementById('searchBtn').addEventListener('click', ()=>{
    const q = document.getElementById('q').value.trim();
    const loc = document.getElementById('loc').value.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (loc) params.set('location', loc);
    const qs = params.toString();
    location.href = 'jobs.html' + (qs ? ('?' + qs) : '');
});`
    );
    fs.writeFileSync('jobseekers.html', html);
    console.log('jobseekers search params fixed');
}

// Expand about page content
{
    let html = fs.readFileSync('about.html', 'utf8');
    if (!html.includes('What we do')) {
        html = html.replace(
            `<p style="margin-top:28px"><a href="contact.html" style="color:#2563eb;font-weight:600">Get in touch →</a></p>
</div></div>`,
            `<h2 style="font-size:1.15rem;font-weight:800;margin:36px 0 12px">What we do</h2>
    <p>RemoteMedicalJobs is a global remote healthcare careers platform. We list curated remote and hybrid roles, maintain a free talent pool for candidates, and offer an optional Career Accelerator with practical telehealth, privacy, CV, and interview modules. Course access is emailed after secure payment with a private portal link.</p>
    <h2 style="font-size:1.15rem;font-weight:800;margin:28px 0 12px">What we are not</h2>
    <p>We are not a mandatory pay-to-apply gate. Browsing jobs and submitting a free application does not require purchasing a course. We do not guarantee interviews, employment, visas, or salary outcomes.</p>
    <p style="margin-top:28px"><a href="contact.html" style="color:#2563eb;font-weight:600">Get in touch →</a> &nbsp;·&nbsp; <a href="jobs.html" style="color:#2563eb;font-weight:600">Browse jobs →</a> &nbsp;·&nbsp; <a href="course.html" style="color:#2563eb;font-weight:600">View course →</a></p>
</div></div>`
        );
        fs.writeFileSync('about.html', html);
        console.log('about expanded');
    }
}

// Expand compliance slightly with links
{
    let html = fs.readFileSync('compliance.html', 'utf8');
    if (!html.includes('Related pages')) {
        html = html.replace(
            /<a class="btn" href="course\.html">Get the full compliance module \(emailed access\)<\/a>\s*<\/div>/,
            `<a class="btn" href="course.html">Get the full compliance module (emailed access)</a>
    <p class="lead" style="margin-top:24px"><strong>Related pages:</strong> <a href="course.html">Course</a> · <a href="privacy.html">Privacy</a> · <a href="contact.html">Contact</a> · <a href="jobs.html">Jobs</a></p>
</div>`
        );
        fs.writeFileSync('compliance.html', html);
        console.log('compliance expanded');
    }
}

// Soften index hero View All already fixed; ensure #seekers gone
{
    let html = fs.readFileSync('index.html', 'utf8');
    const bad = (html.match(/href="#(seekers|about|compliance|contact)"/g) || []);
    console.log('index remaining bad anchors:', bad);
}

console.log('done');
