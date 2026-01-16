const fs = require('fs');
const p = 'c:\\Users\\combo\\Documents\\projetos\\alignprojeto\\align-crm\\align-frontend\\src\\app\\tarefas\\page.tsx';
let s = fs.readFileSync(p, 'utf8');
const first = s.indexOf("use client");
const second = s.indexOf("use client", first + 1);
if (second !== -1) {
  s = s.slice(0, second);
  fs.writeFileSync(p, s, 'utf8');
  console.log('TRUNCATED at', second);
} else {
  console.log('NO_CHANGE');
}
