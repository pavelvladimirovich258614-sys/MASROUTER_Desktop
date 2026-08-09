// scripts/generate-ico.mjs — собирает multi-resolution .ico из PNG.
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sizes = [16, 24, 32, 48, 64, 128, 256];
const images = await Promise.all(
  sizes.map((s) => fs.readFile(join(root, 'assets', `icon-${s}.png`)))
);

const ico = await toIco(images);
await fs.writeFile(join(root, 'assets', 'icon.ico'), ico);
console.log(`[ico] assets/icon.ico (${ico.length} bytes, ${sizes.length} sizes)`);
