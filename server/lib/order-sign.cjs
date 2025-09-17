const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET = process.env.ORDER_SECRET || 'dev_secret';
const TTL = Number(process.env.ORDER_SIGN_TTL || 300); // 5분
const NONCE_DIR = path.join(__dirname, '..', 'data', '.nonce');

// Ensure nonce directory exists
if (!fs.existsSync(NONCE_DIR)) {
  fs.mkdirSync(NONCE_DIR, { recursive: true });
}

function signOrder({ orderId, itemName, amount, ts, nonce }) {
  const msg = `${orderId}|${itemName}|${amount}|${ts}|${nonce}`;
  return crypto.createHmac('sha256', SECRET).update(msg).digest('hex').slice(0, 32);
}

function seen(nonce) {
  const f = path.join(NONCE_DIR, nonce);
  if (fs.existsSync(f)) return true;
  try {
    fs.writeFileSync(f, String(Date.now()), 'utf8');
    return false;
  } catch (e) {
    console.error('[nonce] write error:', e);
    return false;
  }
}

function cleanupOldNonces() {
  try {
    const files = fs.readdirSync(NONCE_DIR);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(NONCE_DIR, file);
      const stat = fs.statSync(filePath);
      // Remove nonces older than 1 hour
      if (now - stat.mtimeMs > 3600000) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[nonce] cleaned ${cleaned} old nonces`);
    }
  } catch (e) {
    console.error('[nonce] cleanup error:', e);
  }
}

function verifyOrder({ orderId, itemName, amount, ts, nonce, sig }) {
  if (!ts || !nonce || !sig) return false;

  const now = Math.floor(Date.now() / 1000);
  const timestamp = Number(ts);

  // Check timestamp validity (within TTL)
  if (Math.abs(now - timestamp) > TTL) return false;

  // Verify signature
  const expected = signOrder({ orderId, itemName, amount, ts, nonce });
  if (sig !== expected) return false;

  // Check for replay (nonce reuse)
  if (seen(nonce)) return false;

  // Cleanup old nonces periodically (1% chance per verification)
  if (Math.random() < 0.01) {
    setImmediate(cleanupOldNonces);
  }

  return true;
}

module.exports = { signOrder, verifyOrder };