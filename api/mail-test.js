// api/mail-test.js
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION,
  credentials: process.env.SES_ACCESS_KEY_ID ? {
    accessKeyId: process.env.SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
  } : (process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined),
});

module.exports = async function (req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
    const { to, subject, html } = req.body || {};
    if (!to) return res.status(400).json({ error: "to is required" });
    if (!process.env.SES_FROM) return res.status(500).json({ error: "SES_FROM not set" });

    const params = {
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject || "MindQuiz test", Charset: "UTF-8" },
        Body: { Html: { Data: html || `<p>test ${new Date().toISOString()}</p>` } },
      },
      Source: process.env.SES_FROM,
    };
    await ses.send(new SendEmailCommand(params));
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
};
