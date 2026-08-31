import fs from 'fs';

const content = fs.readFileSync('./public/app.js', 'utf-8');
const lines = content.split('\n');

const apiCalls = new Set();
lines.forEach((line, idx) => {
  const match = line.match(/(['"`]\/api\/[^'"`]+['"`])/g);
  if (match) {
    match.forEach(m => apiCalls.add(`${m} (line ${idx + 1})`));
  }
});

console.log('--- ALL API ENDPOINTS IN public/app.js ---');
Array.from(apiCalls).sort().forEach(c => console.log(c));
