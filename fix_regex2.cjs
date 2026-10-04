const fs = require('fs');
const content = fs.readFileSync('src/lib/nawawi.ts', 'utf8');
const fixed = content.replace(/\\\\\s\+/, '\\s+');
fs.writeFileSync('src/lib/nawawi.ts', fixed, 'utf8');
