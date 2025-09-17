// Shared metrics state using file system for cross-process communication
const fs = require('fs');
const path = require('path');

const METRICS_FILE = path.join(__dirname, '..', 'data', '.metrics.json');

function ensureFile() {
  const dir = path.dirname(METRICS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(METRICS_FILE)) {
    fs.writeFileSync(METRICS_FILE, JSON.stringify({ mq_last_backup_timestamp: 0 }));
  }
}

function readSharedMetrics() {
  try {
    ensureFile();
    return JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
  } catch {
    return { mq_last_backup_timestamp: 0 };
  }
}

function writeSharedMetrics(data) {
  try {
    ensureFile();
    fs.writeFileSync(METRICS_FILE, JSON.stringify(data));
  } catch (e) {
    console.error('[shared-metrics] write error:', e);
  }
}

function setBackupTimestamp(timestamp) {
  const metrics = readSharedMetrics();
  metrics.mq_last_backup_timestamp = timestamp;
  writeSharedMetrics(metrics);
}

module.exports = {
  readSharedMetrics,
  writeSharedMetrics,
  setBackupTimestamp
};