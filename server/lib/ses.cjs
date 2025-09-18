// server/lib/ses.cjs
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const ses = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION,
  credentials: process.env.SES_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.SES_ACCESS_KEY_ID,
        secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
      }
    : (process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      } : undefined),
});

async function sendMail({ to, subject, html, text }) {
  if (!process.env.SES_FROM) throw new Error("SES_FROM env is not set");
  const params = {
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    Message: {
      Subject: { Data: subject || "(no subject)", Charset: "UTF-8" },
      Body: {},
    },
    Source: process.env.SES_FROM,
  };
  if (html) params.Message.Body.Html = { Data: html, Charset: "UTF-8" };
  if (text) params.Message.Body.Text = { Data: text, Charset: "UTF-8" };
  const cmd = new SendEmailCommand(params);
  return ses.send(cmd);
}

module.exports = { sendMail, sesClient: ses };
