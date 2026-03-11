import fs from 'node:fs/promises';
import path from 'node:path';

const apiUrl = (process.env.GF_API_URL || process.env.API_URL || '').trim();
if (!apiUrl) {
  process.exit(0);
}

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, 'public', 'env.js');

const contents = `// Generated at build time (Vercel-friendly).
// Source: process.env.GF_API_URL (or API_URL)
window.__env = window.__env || {};
window.__env.apiUrl = ${JSON.stringify(apiUrl)};
`;

await fs.mkdir(path.dirname(envPath), { recursive: true });
await fs.writeFile(envPath, contents, 'utf8');
console.log(`[env] Wrote public/env.js with apiUrl=${apiUrl}`);

