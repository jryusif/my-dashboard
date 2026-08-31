import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  let htmlContent = '';
  try {
    htmlContent = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    htmlContent = '<div>Loading dashboard...</div>';
  }

  // Extract body inner content from index.html (excluding trailing script tags)
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let bodyInner = bodyMatch ? bodyMatch[1] : htmlContent;

  // Remove script tags from the injected markup since layout.js includes them
  bodyInner = bodyInner.replace(/<script[\s\S]*?<\/script>/gi, '');

  return (
    <main dangerouslySetInnerHTML={{ __html: bodyInner }} />
  );
}
