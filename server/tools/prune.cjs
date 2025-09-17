const fs = require('fs'); const path = require('path');
const DAYS = Number(process.env.PRUNE_DAYS || process.argv[2] || 30);
const BASE = path.join(__dirname, '..', 'data');
const targets = ['archive','backup'];
const limit = Date.now() - DAYS*24*60*60*1000;

let removed = 0;
for (const t of targets) {
  const dir = path.join(BASE, t);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.mtimeMs < limit) { fs.unlinkSync(p); removed++; console.log('pruned', t, f); }
  }
}
console.log(`done: removed ${removed} files older than ${DAYS} days`);