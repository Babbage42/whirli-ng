import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(workspaceRoot, 'storybook-static');
const port = Number(process.argv[2] ?? process.env.STORYBOOK_PORT ?? 6006);

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

function resolveFile(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const relative = normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
  const candidate = resolve(root, `.${sep}${relative}`);

  if (!candidate.startsWith(`${root}${sep}`) && candidate !== root) {
    return undefined;
  }

  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }

  const index = join(candidate, 'index.html');
  if (existsSync(index)) {
    return index;
  }

  return join(root, 'index.html');
}

const server = createServer((request, response) => {
  const file = resolveFile(request.url ?? '/');
  if (!file || !existsSync(file)) {
    response.writeHead(404).end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': contentTypes.get(extname(file)) ?? 'application/octet-stream',
  });
  createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving Storybook static on http://localhost:${port}`);
});
