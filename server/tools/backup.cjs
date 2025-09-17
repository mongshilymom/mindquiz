const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { setBackupTimestamp } = require('../lib/shared-metrics.cjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUT_DIR = path.join(DATA_DIR, 'backup');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const ts = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.ndjson'));

const temp = path.join(OUT_DIR, `concat-${ts}.ndjson`);
fs.writeFileSync(
  temp,
  files.map(f => fs.readFileSync(path.join(DATA_DIR, f), 'utf8')).join('\n')
);

const gz = zlib.createGzip();
const out = fs.createWriteStream(path.join(OUT_DIR, `mindquiz-data-${ts}.ndjson.gz`));
fs.createReadStream(temp).pipe(gz).pipe(out).on('finish', () => {
  fs.unlinkSync(temp);

  // Update backup timestamp metric
  setBackupTimestamp(Math.floor(Date.now() / 1000));

  console.log('backup ok:', path.basename(out.path));
});
