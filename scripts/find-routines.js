import fs from 'fs';
const text = fs.readFileSync('./public/app.js', 'utf-8');
const lines = text.split('\n');
lines.forEach((l, i) => {
  if (l.toLowerCase().includes('routine') && (l.includes('Form') || l.includes('Modal') || l.includes('add') || l.includes('Submit'))) {
    console.log(`Line ${i+1}: ${l}`);
  }
});
