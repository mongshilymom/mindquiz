const fs = require('fs');
const path = require('path');
const { _files } = require('../lib/store.cjs'); // 경로 주의

const DST_DIR = path.join(__dirname, '..', 'data', 'archive');
if (!fs.existsSync(DST_DIR)) fs.mkdirSync(DST_DIR, { recursive: true });

const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);

for (const [name, file] of Object.entries(_files)) {
  const dst = path.join(DST_DIR, `${name}-${ts}.ndjson`);
  if (fs.existsSync(file) && fs.statSync(file).size > 0) {
    fs.copyFileSync(file, dst);
    fs.truncateSync(file, 0);
    console.log(`rotated: ${name} -> ${dst}`);
  }
}
