// scripts/generate-icon.mjs — рендерит assets/icon.svg в icon.png нужных размеров.
import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'assets', 'icon.svg');
const pngPath = join(root, 'assets', 'icon.png');

const svg = await fs.readFile(svgPath, 'utf8');

// Главная иконка 512x512 для electron-builder.
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 512 },
  background: '#05080A'
});
const png = resvg.render().asPng();
await fs.writeFile(pngPath, png);
console.log(`[icon] ${pngPath} (${png.length} bytes)`);

// Дополнительные размеры для .ico (Windows).
const sizes = [16, 24, 32, 48, 64, 128, 256];
for (const size of sizes) {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: '#05080A'
  });
  await fs.writeFile(join(root, 'assets', `icon-${size}.png`), r.render().asPng());
}
console.log(`[icon] Generated sizes: ${sizes.join(', ')}`);
