// scripts/postbuild.mjs — после сборки main создаёт dist/main/package.json с type=commonjs.
// Это нужно, чтобы Node не пытался грузить .js файлы как ESM (т.к. корень имеет type=module).

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mainDir = join(__dirname, '..', 'dist', 'main');
const pkgPath = join(mainDir, 'package.json');

if (!existsSync(mainDir)) {
  console.error(`[postbuild] ${mainDir} does not exist. Run npm run build:main first.`);
  process.exit(1);
}

writeFileSync(pkgPath, JSON.stringify({ type: 'commonjs' }, null, 2) + '\n', 'utf8');
console.log(`[postbuild] Created ${pkgPath} (type: commonjs)`);
