// server/routes/upload.cjs
const express = require("express");
const router = express.Router();
const { createUploadUrl } = require("../lib/s3.cjs");

// 간단한 서버측 보호: 실제 환경에선 인증 미들웨어 추가할 것
router.post("/upload-url", async (req, res) => {
  try {
    const { filename, contentType } = req.body || {};
    if (!filename || !contentType) return res.status(400).json({ error: "filename and contentType required" });

    // 안전한 키 네이밍 (타임스탬프 + 원래 이름)
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${Date.now()}-${safeName}`;

    const url = await createUploadUrl({ key, contentType });
    res.json({ url, key });
  } catch (err) {
    console.error("upload-url error:", err);
    res.status(500).json({ error: "failed to create upload url", detail: String(err.message || err) });
  }
});

module.exports = router;
