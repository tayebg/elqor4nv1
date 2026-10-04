const fs = require('fs');
const content = fs.readFileSync('src/lib/nawawi.ts', 'utf8');
const fixed = content.replace(/const sentences = body\.split\(.*?\);/, 'const sentences = body.split(/(?<=[\\"\\\\u201D”\\\\.،!؟])\\\\s+/);');
fs.writeFileSync('src/lib/nawawi.ts', fixed, 'utf8');
