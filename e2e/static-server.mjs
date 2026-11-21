// Minimal static server for E2E tests: serves the prerendered build with clean URLs
// and applies the headers declared in vercel.json, so tests run under the production security policy.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('dist/hum-finder/browser');
const port = Number(process.env.PORT ?? 4300);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

let headerRules = [];
try {
  // Only regex-style sources such as "/(.*)" are supported here.
  headerRules = JSON.parse(await readFile('vercel.json', 'utf8')).headers ?? [];
} catch {
  headerRules = [];
}

async function findFile(path) {
  for (const candidate of [path, join(path, 'index.html'), `${path}.html`]) {
    const file = normalize(join(root, candidate));
    if (!file.startsWith(root)) {
      return null;
    }
    const info = await stat(file).catch(() => null);
    if (info?.isFile()) {
      return file;
    }
  }
  return null;
}

createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  for (const rule of headerRules) {
    if (new RegExp(`^${rule.source}$`).test(path)) {
      rule.headers.forEach(({ key, value }) => response.setHeader(key, value));
    }
  }
  const file = await findFile(path);
  if (!file) {
    response.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    return;
  }
  response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  response.end(await readFile(file));
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
