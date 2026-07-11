const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'jobs.html');
let h = fs.readFileSync(file, 'utf8');
if (h.includes('Prefill search from')) {
    console.log('already patched');
    process.exit(0);
}
const inject = `// Prefill search from ?q=
(function(){ try{ const q=new URLSearchParams(location.search).get('q'); if(q){ const el=document.getElementById('mainSearch'); if(el){ el.value=q; }} }catch(e){} })();
`;
// Insert before initial filterJobs call at bottom
if (h.includes('filterJobs();')) {
    h = h.replace('filterJobs();', inject + 'filterJobs();');
    fs.writeFileSync(file, h);
    console.log('patched');
} else {
    console.log('filterJobs(); not found');
}
