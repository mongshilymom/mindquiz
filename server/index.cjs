/* MindQuiz minimal server (Windows-safe)
   - Health:   /api/health
   - SPA:      /app/*   (client/dist가 있을 때)
   - Share:    /r/:id   (임시 SSR 페이지)
*/
const path = require('path');
const fs = require('fs');
const express = require('express');

const app  = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3000;
const SITE = process.env.SITE_URL || `http://${HOST}:${PORT}`;

app.use(express.json({ limit: '1mb' }));
app.use("/api", require("./routes/upload.cjs"));
app.use("/api", require("./routes/mail.cjs"));

app.disable('x-powered-by');


// --- 헬스체크 ---
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// --- 서버 정적 자산(server/assets) ---
const assetsDir = path.join(__dirname, 'assets');
if (fs.existsSync(assetsDir)) {
  app.use('/assets', express.static(assetsDir, { maxAge: '1y', immutable: true }));
}

// --- 프론트(dist) 서빙 (/app) ---
const ROOT = path.resolve(__dirname, '..');          // 프로젝트 루트
const distDir = path.join(ROOT, 'client', 'dist');   // Vite 빌드 위치

if (fs.existsSync(distDir)) {
  // 정적 파일 서빙 (index는 SPA 히스토리 처리를 위해 false)
  app.use('/app', express.static(distDir, { index: false }));

  // SPA 히스토리 fallback: /app/* -> dist/index.html
  app.get(/^\/app(\/.*)?$/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  // dist가 없을 때 안내 페이지 (개발 중 흰 화면 방지)
  app.get('/app*', (_req, res) => {
    res
      .status(200)
      .type('html')
      .send(`<!doctype html><meta charset="utf-8">
      <title>MindQuiz</title>
      <pre>
client/dist 가 없습니다.

개발모드:
  npm run dev        # 서버(3000)
  npm run dev:client # 프론트(5173) → http://localhost:5173/result/demo1

빌드해서 3000에서 보기:
  npm run build:client
  npm run dev
  브라우저: ${SITE}/app/result/demo1
      </pre>`);
  });
}

// --- 공유(SSR)용 임시 페이지 ---
app.get('/r/:id', (req, res) => {
  const id = req.params.id;
  res
    .status(200)
    .type('html')
    .send(`<!doctype html><meta charset="utf-8">
    <title>MindQuiz Share - ${id}</title>
    <h1>Share: ${id}</h1>
    <p>이 페이지는 임시 SSR 프리뷰입니다. 실제 렌더러로 교체하세요.</p>`);
});

// --- /app 진입 리다이렉트(편의) ---
app.get('/app', (_req, res) => res.redirect('/app/result/demo1'));

// --- 루트 안내 ---
app.get('/', (_req, res) => {
  res
    .status(200)
    .type('html')
    .send(`<!doctype html><meta charset="utf-8">
    <title>MindQuiz Dev Server</title>
    <pre>
MindQuiz dev server running.

Health: ${SITE}/api/health
SPA:    ${SITE}/app/result/demo1   (빌드된 경우)
Share:  ${SITE}/r/demo1

개발모드(분리 실행):
  npm run dev        # 3000 서버
  npm run dev:client # 5173 프론트 → http://localhost:5173/result/demo1

빌드해서 3000에서 보기:
  npm run build:client && npm run dev
    </pre>`);
});

// --- 에러 핸들러 ---
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, error: String(err && err.message || err) });
});

// --- 서버 시작(Host 지정: Windows 안전) ---
app.listen(PORT, HOST, () => {
  console.log(`[MindQuiz] server started: ${SITE}`);
  console.log(`- SPA:           ${SITE}/app/result/demo1`);
  console.log(`- Share(SSR):    ${SITE}/r/demo1`);
  console.log(`- Health:        ${SITE}/api/health`);
});

