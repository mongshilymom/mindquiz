// server/lib/s3.cjs
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

async function createUploadUrl({ key, contentType, expiresIn = 60 }) {
  if (!process.env.S3_BUCKET) throw new Error("S3_BUCKET env is not set");
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: "private",
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
  return url;
}

module.exports = { createUploadUrl, s3Client: s3 };
