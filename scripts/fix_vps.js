const fs = require('fs');
const p = 'c:/Users/combo/Documents/projetos/alignprojeto/align-crm/align-frontend/src/app/vps/page.tsx';
let s = fs.readFileSync(p, 'utf8');
const parts = s.split('"use client"');
if (parts.length > 2) {
  const out = '"use client"' + parts[1];
  fs.writeFileSync(p, out, 'utf8');
  console.log('fixed');
} else {
  console.log('no-change');
}
