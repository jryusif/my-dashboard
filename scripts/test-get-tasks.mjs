import jwt from 'jsonwebtoken';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const secretMatch = env.match(/JWT_SECRET="?([^"\r\n]+)"?/);
const JWT_SECRET = secretMatch ? secretMatch[1] : 'dev-fallback-jwt-secret-replace-in-production';
const token = jwt.sign({ userId: 'cmtidl7up0000llityy9nhmtu', email: 'jryusiif@gmail.com', role: 'ADMIN' }, JWT_SECRET);

async function run() {
  const res = await fetch('http://localhost:3000/api/tasks', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('HTTP Status:', res.status);
  const data = await res.json();
  console.log('Total tasks returned:', data.tasks ? data.tasks.length : 'none');
  const cats = {};
  (data.tasks || []).forEach(t => {
    cats[t.category] = (cats[t.category] || 0) + 1;
    console.log(`  [${t.category}] "${t.title}" | date: ${t.date} | completed: ${t.completed}`);
  });
  console.log('Category Counts:', cats);
}

run().catch(console.error);
