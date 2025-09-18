// api/upload-url.js
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

module.exports = async function (req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
    const { filename, contentType } = req.body || {};
    if (!filename || !contentType) return res.status(400).json({ error: "filename/contentType required" });

    if (!process.env.S3_BUCKET) return res.status(500).json({ error: "S3_BUCKET not set" });

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${Date.now()}-${safeName}`;

    const cmd = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ACL: "private",
    });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });

    return res.json({ url, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
};
