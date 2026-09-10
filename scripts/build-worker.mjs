import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/server', { recursive: true });
await cp('server/index.mjs', 'dist/server/index.js');
