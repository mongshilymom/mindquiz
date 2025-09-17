const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backup');
const tmp = path.join(__dirname, '..', 'data', 'tmp-restore-check');

if (!fs.existsSync(BACKUP_DIR)) throw new Error('backup dir not found');
if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });

// 최신 백업 파일 찾기
const files = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.endsWith('.ndjson.gz'))
  .map(f => ({
    f,
    t: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs
  }))
  .sort((a, b) => b.t - a.t);

if (!files[0]) throw new Error('no backup files');

const latest = path.join(BACKUP_DIR, files[0].f);
const out = path.join(tmp, 'restore.ndjson');

fs.createReadStream(latest)
  .pipe(zlib.createGunzip())
  .pipe(fs.createWriteStream(out))
  .on('finish', () => {
    const text = fs.readFileSync(out, 'utf8').trim();
    const lines = text.split('\n').slice(0, 5); // 샘플 5라인만 파싱 검사
    let ok = 0;
    for (const line of lines) {
      try {
        JSON.parse(line);
        ok++;
      } catch {}
    }
    console.log(`[restore-check] file=${path.basename(latest)} lines=${lines.length} parsed=${ok}`);

    // 임시파일 정리
    try {
      fs.rmSync(tmp, { recursive: true, force: true });
    } catch {}
  })
  .on('error', (e) => {
    console.error('restore-check error:', e);
    process.exit(1);
  });