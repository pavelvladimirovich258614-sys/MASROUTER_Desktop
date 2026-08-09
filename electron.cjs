// Entry point for Electron. Loads the compiled main process.
// In dev (no dist/main yet) we exit early with a clear message.
const path = require('node:path');
const fs = require('node:fs');

// Override "type": "module" from root package.json — main process is CommonJS.
// Without this, Node would try to load index.js as ESM and fail.
const mainDir = path.join(__dirname, 'dist', 'main');
if (!fs.existsSync(path.join(mainDir, 'package.json'))) {
  fs.writeFileSync(
    path.join(mainDir, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2)
  );
}

const mainPath = path.join(mainDir, 'src', 'main', 'index.js');
if (!fs.existsSync(mainPath)) {
  console.error('\n[!] Main process is not built.');
  console.error('    Run: npm run build');
  console.error('    Or:  npm run dev\n');
  process.exit(1);
}

require(mainPath);
