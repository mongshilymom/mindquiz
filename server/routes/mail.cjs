// server/routes/mail.cjs
const express = require("express");
const router = express.Router();
const { sendMail } = require("../lib/ses.cjs");

// 간단 테스트용: 운영에선 인증/레이트리밋 추가 권장
router.post("/mail-test", async (req, res) => {
  try {
    const { to, subject, html } = req.body || {};
    if (!to) return res.status(400).json({ error: "to is required" });

    await sendMail({
      to,
      subject: subject || "MindQuiz 알림 테스트",
      html: html || `<p>테스트 메일입니다. ${new Date().toISOString()}</p>`,
      text: "MindQuiz test mail",
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("mail-test error:", err);
    res.status(500).json({ error: "failed to send mail", detail: String(err.message || err) });
  }
});

module.exports = router;
