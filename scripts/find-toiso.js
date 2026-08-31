import fs from 'fs';
const text = fs.readFileSync('./public/app.js', 'utf-8');
const lines = text.split('\n');
lines.forEach((l, i) => {
  if (l.includes('toISODate')) {
    console.log(`Line ${i+1}: ${l}`);
  }
});
