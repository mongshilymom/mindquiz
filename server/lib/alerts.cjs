const https = require('https');

function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const body = Buffer.from(JSON.stringify(data));
      const opt = {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname + u.search,
        port: u.port || 443,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': body.length
        }
      };
      const req = https.request(opt, (res) => {
        let chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function notify(text, fields = {}) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const blocks = [{ type: 'section', text: { type: 'mrkdwn', text } }];
  if (Object.keys(fields).length) {
    blocks.push({
      type: 'section',
      fields: Object.entries(fields).map(([k, v]) => ({
        type: 'mrkdwn',
        text: `*${k}:*\n${v}`
      }))
    });
  }

  try {
    await postJSON(url, { text, blocks });
  } catch (e) {
    // Silent fail - don't break app if Slack is down
    console.error('Slack notification failed:', e.message);
  }
}

module.exports = { notify };