import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const files = readdirSync('dist/assets').filter(name => /\.(js|css)$/.test(name));
const totals = { javascript: 0, css: 0, gzip: 0 };
for (const name of files) {
  const bytes = readFileSync(`dist/assets/${name}`);
  totals[name.endsWith('.js') ? 'javascript' : 'css'] += bytes.length;
  totals.gzip += gzipSync(bytes).length;
}
// Measured after the ten-era redesign; leave room for small authored additions.
const limits = { javascript: 1200000, css: 100000, gzip: 350000 };
for (const key of Object.keys(limits)) if (totals[key] > limits[key]) throw new Error(`${key}: ${totals[key]} bytes exceeds ${limits[key]}`);
console.log(`Asset budgets pass: ${JSON.stringify(totals)} bytes`);
