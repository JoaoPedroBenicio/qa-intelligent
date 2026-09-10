import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

await mkdir('dist/server', { recursive: true });
const files = {};
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (absolute.startsWith(path.join('dist', 'server'))) continue;
    if (entry.isDirectory()) await collect(absolute);
    else {
      const relative = `/${path.relative('dist', absolute).replaceAll(path.sep, '/')}`;
      const type = relative.endsWith('.html') ? 'text/html; charset=utf-8' : relative.endsWith('.css') ? 'text/css; charset=utf-8' : relative.endsWith('.js') ? 'text/javascript; charset=utf-8' : relative.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
      files[relative] = { type, content: (await readFile(absolute)).toString('base64') };
    }
  }
}
await collect('dist');
const source = await readFile('server/index.mjs', 'utf8');
await writeFile('dist/server/index.js', source.replace('__STATIC_FILES__', JSON.stringify(files)));
