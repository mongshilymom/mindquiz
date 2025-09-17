const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const store = require('./lib/store.cjs');
const { notify } = require('./lib/alerts.cjs');
const metrics = require('./lib/metrics.cjs');
const { computeFinalAmount } = require('./lib/pricing.cjs');
const router = express.Router();

// Admin file management constants
const DATA_DIR = path.join(__dirname, 'data');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archive');
const BACKUP_DIR  = path.join(DATA_DIR, 'backup');

function requireAdmin(req, res) {
  const pass = (req.query.pass || req.body.pass || '').toString();
  if (pass !== (process.env.ADMIN_PASS || '')) {
    res.status(401).send('unauthorized'); return null;
  }
  return pass;
}
function listFilesSafe(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map(f => {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    return { name: f, size: st.size, mtime: st.mtimeMs };
  }).sort((a,b)=>b.mtime - a.mtime);
}

function paymentsEnabled() {
  return String(process.env.PAYMENTS_ENABLED || '1') === '1';
}

// 보안/캐시 기본 헤더 (경량)
router.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// ---- 임시 주문 저장소 ----
const orders = new Map();

// ---- 쿠폰 적용 도우미 함수 ----
function applyCouponAmount(amount, coupon) {
  if (!coupon) return { finalAmount: amount, meta: {} };
  const type = (coupon.type || coupon.offer || '').toString().toUpperCase();
  if (type === 'DISCOUNT_10' || type === 'PCT10') {
    const discounted = Math.max(100, Math.floor(amount * 0.9)); // 최소 100원 방어
    return { finalAmount: discounted, meta: { couponType: 'DISCOUNT_10' } };
  }
  if (type === 'EXPANSION_PACK' || type === 'FREE_ADDON') {
    return { finalAmount: amount, meta: { couponType: 'EXPANSION_PACK', addon: true } };
  }
  return { finalAmount: amount, meta: {} };
}

// ---- 16 페르소나(예시; H→M 반영) ----
const personalityTypes = {
  PJEM: { label: '통찰력 있는 전략가' },
  RJEM: { label: '신뢰를 주는 리더' },
  RFEM: { label: '에너자이저 활동가' },
  PJIM: { label: '창의적인 혁신가' },
  RJIM: { label: '체계적인 관리자' },
  RFIM: { label: '감성적인 조력자' },
  PJEM_ALT: { label: '논리적인 분석가' },
  RJEM_ALT: { label: '실용적인 실행가' },
  RFEM_ALT: { label: '사교적인 연결고리' },
  PJIM_ALT: { label: '독립적인 사색가' },
  RJIM_ALT: { label: '책임감 있는 수호자' },
  RFIM_ALT: { label: '따뜻한 중재자' },
  FLEX1: { label: '모험적인 탐험가' },
  FLEX2: { label: '예술적인 표현가' },
  FLEX3: { label: '자유로운 영혼' },
  FLEX4: { label: '균형잡힌 조화자' }
};

// Health
router.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------- Order Signing ----------
const { signOrder, verifyOrder } = require('./lib/order-sign.cjs');
router.post('/api/order/sign', (req, res) => {
  const { orderId, itemName, amount } = req.body || {};
  if (!orderId || !itemName || !amount) {
    return res.status(400).json({ error: 'MISSING_FIELDS' });
  }

  const ts = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(8).toString('hex');
  const sig = signOrder({ orderId, itemName, amount, ts, nonce });

  metrics.increment('order_sign_calls_total');
  return res.json({ sig, ts, nonce });
});

// ---------- 결과 페이지용 SSR 브리지 (/r/:id) ----------
// SPA로 렌더하되, SNS는 여기 메타를 읽도록 설계.
router.get('/r/:id', (req, res) => {
  // 리퍼럴 쿠키 저장 (7일 동안)
  const ref = (req.query.ref || '').toString().slice(0, 64);
  if (ref) {
    res.cookie('mq_ref', ref, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'Lax' });
  }

  const id = req.params.id;
  const keys = Object.keys(personalityTypes);
  const key = keys[Math.floor(Math.random() * keys.length)];
  const persona = personalityTypes[key].label;
  const meme = '큰 그림 그리고, 팀을 살려내는 피젬.';
  const name = 'MindQuiz';

  const siteUrl = process.env.SITE_URL || 'http://localhost:3004';
  const ogImage = `${siteUrl}/api/og?type=${encodeURIComponent(key)}&persona=${encodeURIComponent(persona)}&meme=${encodeURIComponent(meme)}&name=${encodeURIComponent(name)}&v=${Date.now()}`;

  res.render('result_meta', {
    title: `${persona} (${key}) - MindQuiz`,
    ogTitle: `내 코드 ${key}`,
    ogDesc: `${persona} - ${meme}`,
    ogImage,
    url: `${siteUrl}/r/${id}`,
    spaUrl: `${siteUrl}/app/result/${id}`
  });
});


// ---------- KakaoPay ----------
router.post('/api/payment/kakao/ready', async (req, res) => {
  if (!paymentsEnabled()) {
    return res.status(503).json({ error: 'PAYMENTS_DISABLED' });
  }

  const { orderId, itemName, amount, sig, ts, nonce, couponCode, skuType } = req.body || {};

  // HMAC 검증 (요청의 amount는 위조 여부 확인용; 실제 결제 금액은 finalAmount로 대체)
  if (!verifyOrder({ orderId, itemName, amount, ts, nonce, sig })) {
    return res.status(400).json({ error: 'INVALID_SIGNATURE' });
  }

  metrics.increment('payment_ready_calls_total');
  const origin = process.env.SITE_URL;

  // 1) 쿠폰 객체 조회
  const coupon = couponCode ? store.getCoupon(couponCode) : null;

  // 2) 서버 권한 가격 계산 (클라이언트 amount를 절대 신뢰하지 않음)
  const finalAmount = computeFinalAmount({ skuType: skuType || 'REPORT_BASE', coupon });

  // 3) 쿠폰 홀드 처리
  if (couponCode) {
    const hold = store.holdCoupon(couponCode, orderId);
    if (!hold.ok) return res.status(400).json({ error: 'INVALID_COUPON' });
  }

  const payload = {
    cid: process.env.KAKAOPAY_CID,
    partner_order_id: orderId,
    partner_user_id: orderId,
    item_name: itemName,
    quantity: 1,
    total_amount: finalAmount,
    tax_free_amount: 0,
    approval_url: `${origin}/api/payment/kakao/approve?orderId=${orderId}${couponCode ? `&coupon=${encodeURIComponent(couponCode)}` : ''}`,
    cancel_url: `${origin}/checkout/canceled?orderId=${orderId}${couponCode ? `&coupon=${encodeURIComponent(couponCode)}` : ''}`,
    fail_url: `${origin}/checkout/failed?orderId=${orderId}${couponCode ? `&coupon=${encodeURIComponent(couponCode)}` : ''}`
  };

  const r = await fetch('https://open-api.kakaopay.com/online/v1/payment/ready', {
    method: 'POST',
    headers: { 'Authorization': `SECRET_KEY ${process.env.KAKAOPAY_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!r.ok) return res.status(500).json({ error: await r.text() });
  const data = await r.json();
  orders.set(orderId, { tid: data.tid, status: 'READY', finalAmount, couponCode: couponCode || null });
  store.saveOrder({ orderId, provider:'kakao', stage:'READY', tid:data.tid, amount:finalAmount, couponCode: couponCode || null });
  const redirect_url = data.next_redirect_mobile_url || data.next_redirect_pc_url || data.next_redirect_app_url;
  return res.json({ redirect_url, tid: data.tid });
});

router.get('/api/payment/kakao/approve', async (req, res) => {
  const { orderId, pg_token, coupon: couponCode } = req.query;
  const rec = orders.get(orderId);
  const body = {
    cid: process.env.KAKAOPAY_CID,
    tid: rec?.tid,
    partner_order_id: orderId,
    partner_user_id: orderId,
    pg_token
  };

  const r = await fetch('https://open-api.kakaopay.com/online/v1/payment/approve', {
    method: 'POST',
    headers: { 'Authorization': `SECRET_KEY ${process.env.KAKAOPAY_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    if (couponCode) store.releaseCoupon(couponCode.toString());
    const errorMsg = await r.text();
    metrics.increment('payment_failure_total');
    await notify('❌ KakaoPay approval failed', {
      orderId: String(orderId),
      error: errorMsg,
      coupon: couponCode || 'none'
    });
    return res.redirect(`/checkout/failed?orderId=${orderId}&msg=${encodeURIComponent(errorMsg)}`);
  }
  const data = await r.json();
  orders.set(orderId, { ...rec, status: 'PAID', receipt: data });
  store.updateOrder(orderId, { provider:'kakao', stage:'PAID', receipt:data });
  if (couponCode) store.redeemCoupon(couponCode.toString(), orderId.toString());

  metrics.increment('payment_approval_total');
  metrics.addRevenue(rec?.finalAmount || data.amount?.total || 0, 'kakao');

  // GA4 이벤트 서버 로그 기록
  store.logEvent({
    kind:'ga4_event',
    name:'purchase_complete',
    orderId,
    value: rec.finalAmount,
    coupon: rec.couponCode || null,
    provider: 'kakao'
  });

  // 리퍼럴 보상 발급
  const ref = (req.cookies?.mq_ref || '').toString();
  if (ref) {
    const code = store.issueCoupon('DISCOUNT_10', null);
    store.logEvent({ kind: 'referral_reward', orderId, ref, code });
    metrics.increment('referral_reward_total');
    // Slack 알림
    try {
      await notify('🎁 Referral reward issued', { orderId: String(orderId), ref, code });
    } catch {}
  }

  return res.redirect(`${process.env.KAKAOPAY_APPROVAL_REDIRECT}?orderId=${orderId}`);
});

// ---------- NaverPay ----------
router.post('/api/payment/naver/ready', async (req, res) => {
  if (!paymentsEnabled()) {
    return res.status(503).json({ error: 'PAYMENTS_DISABLED' });
  }

  const { orderId, itemName, amount, ts, nonce, sig, couponCode, skuType } = req.body || {};

  // 1) 강화된 HMAC 검증 (timestamp + nonce 포함)
  if (!verifyOrder({ orderId, itemName, amount, ts, nonce, sig })) {
    return res.status(400).json({ error: 'INVALID_SIGNATURE' });
  }

  metrics.increment('payment_ready_calls_total');
  const origin = process.env.SITE_URL;

  // 2) 서버권한 가격계산 (클라이언트 amount 무시)
  let coupon = null;
  if (couponCode) {
    coupon = store.getCoupon(couponCode);
    if (!coupon) return res.status(400).json({ error: 'INVALID_COUPON' });
  }

  const finalAmount = computeFinalAmount({ skuType: skuType || 'REPORT_BASE', coupon });

  // 3) 쿠폰 홀드 처리
  if (couponCode) {
    const hold = store.holdCoupon(couponCode, orderId);
    if (!hold.ok) return res.status(400).json({ error: 'INVALID_COUPON' });
  }

  const reserveUrl = `https://${process.env.NAVERPAY_API_DOMAIN}/${process.env.NAVERPAY_PARTNER_ID}/naverpay/payments/v2/reserve`;
  const payload = {
    merchantPayKey: orderId,
    merchantUserKey: orderId,
    productName: itemName,
    totalPayAmount: finalAmount,
    taxScopeAmount: finalAmount,
    taxExScopeAmount: 0,
    returnUrl: `${origin}/api/payment/naver/approve?orderId=${orderId}${couponCode ? `&coupon=${encodeURIComponent(couponCode)}` : ''}`
  };

  const r = await fetch(reserveUrl, {
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Naver-Client-Id': process.env.NAVERPAY_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVERPAY_CLIENT_SECRET,
      'X-NaverPay-Chain-Id': process.env.NAVERPAY_CHAIN_ID,
      'X-NaverPay-Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify(payload)
  });

  if (!r.ok) return res.status(500).json({ error: await r.text() });
  const data = await r.json();
  const reserveId = data?.body?.reserveId;
  orders.set(orderId, { reserveId, status:'RESERVED', finalAmount, couponCode: couponCode || null });
  store.saveOrder({ orderId, provider:'naver', stage:'RESERVED', reserveId, amount:finalAmount, couponCode: couponCode || null });
  const redirect_url = `https://${process.env.NAVERPAY_SERVICE_DOMAIN}/payments/${reserveId}`;
  return res.json({ redirect_url, reserveId });
});

router.get('/api/payment/naver/approve', async (req, res) => {
  const { orderId, paymentId, resultCode, coupon: couponCode } = req.query;
  if (resultCode && resultCode !== 'Success') {
    if (couponCode) store.releaseCoupon(couponCode.toString());
    metrics.increment('payment_cancel_total');
    return res.redirect(`/checkout/canceled?orderId=${orderId}&code=${resultCode}`);
  }

  const approveUrl = `https://${process.env.NAVERPAY_API_DOMAIN}/${process.env.NAVERPAY_PARTNER_ID}/naverpay/payments/v2/apply/payment`;
  const body = new URLSearchParams({ paymentId });

  const r = await fetch(approveUrl, {
    method:'POST',
    headers:{
      'Content-Type':'application/x-www-form-urlencoded',
      'X-Naver-Client-Id': process.env.NAVERPAY_CLIENT_ID,
      'X-Naver-Client-Secret': process.env.NAVERPAY_CLIENT_SECRET,
      'X-NaverPay-Chain-Id': process.env.NAVERPAY_CHAIN_ID,
      'X-NaverPay-Idempotency-Key': crypto.randomUUID()
    },
    body
  });

  if (!r.ok) {
    if (couponCode) store.releaseCoupon(couponCode.toString());
    const errorMsg = await r.text();
    metrics.increment('payment_failure_total');
    await notify('❌ NaverPay approval failed', {
      orderId: String(orderId),
      error: errorMsg,
      coupon: couponCode || 'none'
    });
    return res.redirect(`/checkout/failed?orderId=${orderId}&msg=${encodeURIComponent(errorMsg)}`);
  }
  const data = await r.json();
  const rec = orders.get(orderId) || {};
  orders.set(orderId, { ...rec, status:'PAID', receipt:data });
  store.updateOrder(orderId, { provider:'naver', stage:'PAID', receipt:data });
  if (couponCode) store.redeemCoupon(couponCode.toString(), orderId.toString());

  metrics.increment('payment_approval_total');
  metrics.addRevenue(rec?.finalAmount || data.paymentInfo?.cardAmount || 0, 'naver');

  // GA4 이벤트 서버 로그 기록
  store.logEvent({
    kind:'ga4_event',
    name:'purchase_complete',
    orderId,
    value: rec.finalAmount,
    coupon: rec.couponCode || null,
    provider: 'naver'
  });

  // 리퍼럴 보상 발급
  const ref = (req.cookies?.mq_ref || '').toString();
  if (ref) {
    const code = store.issueCoupon('DISCOUNT_10', null);
    store.logEvent({ kind: 'referral_reward', orderId, ref, code });
    metrics.increment('referral_reward_total');
    // Slack 알림
    try {
      await notify('🎁 Referral reward issued', { orderId: String(orderId), ref, code });
    } catch {}
  }

  return res.redirect(`${process.env.NAVERPAY_APPROVAL_REDIRECT}?orderId=${orderId}`);
});

// ---------- 결제 완료/실패/취소 페이지 ----------
router.get('/payment/complete', (req, res) => {
  const orderId = req.query.orderId;
  const exp = (req.query.exp || '').toString().toUpperCase();
  const cta = exp === 'B'
    ? '카톡으로 공유하면 확장팩 무료'
    : '결과 공유하고 10% 할인 쿠폰 받기';
  return res.render('payment_complete', { orderId, cta });
});

router.get('/checkout/failed', (req, res) => {
  const { orderId, coupon: couponCode, msg } = req.query;
  if (couponCode) {
    store.releaseCoupon(couponCode.toString());
  }
  return res.render('checkout_failed', { orderId, msg: msg || '' });
});

router.get('/checkout/canceled', (req, res) => {
  const { orderId, coupon: couponCode } = req.query;
  if (couponCode) {
    store.releaseCoupon(couponCode.toString());
  }
  return res.render('checkout_canceled', { orderId });
});

// ---------- 쿠폰 발급 API ----------
router.get('/api/coupon/issue', (req, res) => {
  const { orderId, exp } = req.query;
  const discountType = exp === 'B' ? 'EXPANSION_PACK' : 'DISCOUNT_10';
  const code = store.issueCoupon(discountType, orderId);
  
  return res.json({ 
    code, 
    type: discountType,
    orderId,
    issuedAt: new Date().toISOString()
  });
});

// ---------- 관리자 로그 ----------
router.get('/admin/logs', (req, res) => {
  const pass = (req.query.pass || '').toString();
  if (pass !== (process.env.ADMIN_PASS || '')) return res.status(401).send('unauthorized');
  const tab = (req.query.tab || 'orders').toString();
  const file = store._files[tab] || store._files.orders;
  const rows = store.list(file);
  if (req.query.csv) {
    const keys = Object.keys(rows[0] || {});
    const csv = [keys.join(','), ...rows.map(r=>keys.map(k=>JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    res.set('Content-Type','text/csv; charset=utf-8');
    return res.send(csv);
  }
  return res.render('admin_logs', { rows, tab, pass });
});

// ---------- 관리자 파일 관리 ----------
router.get('/admin/files', (req, res) => {
  const pass = requireAdmin(req, res); if (!pass) return;
  const tab = (req.query.tab || 'archive').toString(); // 'archive' | 'backup'
  const rows = tab === 'backup' ? listFilesSafe(BACKUP_DIR) : listFilesSafe(ARCHIVE_DIR);
  res.render('admin_logs', { rows: [], tab: 'orders', pass, files: { tab, rows } });
});

// 보안 다운로드 (archive/backup만)
router.get('/admin/file', (req, res) => {
  const pass = requireAdmin(req, res); if (!pass) return;
  const scope = (req.query.scope || 'archive').toString();
  const name  = (req.query.name || '').toString();
  const base  = scope === 'backup' ? BACKUP_DIR : ARCHIVE_DIR;
  const file  = path.join(base, name);
  if (!file.startsWith(base) || !fs.existsSync(file)) return res.status(404).send('not found');
  res.download(file);
});

// ---------- 관리자 환불/취소 API ----------
router.post('/admin/payment/:provider/cancel', express.json(), async (req, res) => {
  const pass = (req.query.pass || req.body.pass || '').toString();
  if (pass !== (process.env.ADMIN_PASS || '')) return res.status(401).json({ error: 'unauthorized' });

  const { provider } = req.params;                // 'kakao' | 'naver'
  const { orderId, reason = 'admin_cancel', reissue = '0' } = req.body || {};
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  // 주문/쿠폰 조회
  const rec = orders.get(orderId) || store.getOrder(orderId);
  if (!rec) return res.status(404).json({ error: 'order not found' });

  let ok = false, payload = null, text = null;

  try {
    if (provider === 'kakao') {
      // KakaoPay Cancel API
      // 참고: amount는 전체 취소 기준. 부분취소면 필요한 금액/부가세 필드 보강.
      const cancelBody = {
        cid: process.env.KAKAOPAY_CID,
        tid: rec.tid || rec?.receipt?.tid,
        cancel_amount: Number(rec.finalAmount || rec?.receipt?.amount?.total || 0),
        cancel_tax_free_amount: 0,
        cancel_vat_amount: 0,
        payload: { orderId, reason }
      };
      const r = await fetch('https://open-api.kakaopay.com/online/v1/payment/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `SECRET_KEY ${process.env.KAKAOPAY_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cancelBody)
      });
      ok = r.ok; text = await r.text(); payload = text ? JSON.parse(text) : null;
    } else if (provider === 'naver') {
      // 네이버는 환경별 엔드포인트가 상이 → NAVERPAY_CANCEL_URL 로 주입
      const url = process.env.NAVERPAY_CANCEL_URL;
      if (!url) return res.status(500).json({ error: 'NAVERPAY_CANCEL_URL missing' });
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Naver-Client-Id': process.env.NAVERPAY_CLIENT_ID || '',
          'X-Naver-Client-Secret': process.env.NAVERPAY_CLIENT_SECRET || ''
        },
        body: JSON.stringify({ orderId, tid: rec.tid, amount: rec.finalAmount, reason })
      });
      ok = r.ok; text = await r.text(); try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
    } else {
      return res.status(400).json({ error: 'unknown provider' });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  if (!ok) return res.status(502).json({ error: 'gateway', detail: payload || text });

  // 내부 상태 업데이트 + 쿠폰 회수/재발급
  store.updateOrder(orderId, { stage: 'CANCELED', provider, cancel: { reason, payload } });
  if (rec.couponCode) {
    if (String(reissue || process.env.OPS_REFUND_REISSUE) === '1') {
      const code = store.issueCoupon(store.getCoupon(rec.couponCode)?.type || 'DISCOUNT_10', null);
      store.logEvent({ kind: 'coupon_reissued', orderId, from: rec.couponCode, to: code });
    } else {
      store.releaseCoupon(rec.couponCode);
      store.logEvent({ kind: 'coupon_released_on_refund', orderId, code: rec.couponCode });
    }
  }

  // Slack notification for successful cancellation
  await notify('↩️ Payment canceled', {
    provider,
    orderId: String(orderId),
    reason,
    amount: String(rec.finalAmount || 0),
    reissued: String(reissue || process.env.OPS_REFUND_REISSUE) === '1' ? 'yes' : 'no'
  });

  return res.json({ ok: true, provider, orderId, payload });
});

// ---------- 관리자 보관주기 정리 ----------
router.post('/admin/prune', express.urlencoded({extended:true}), (req, res) => {
  const pass = (req.query.pass || req.body.pass || '').toString();
  if (pass !== (process.env.ADMIN_PASS || '')) return res.status(401).send('unauthorized');
  const days = (req.body.days || req.query.days || '30').toString();
  try {
    process.env.PRUNE_DAYS = days;
    require('./tools/prune.cjs');
    return res.json({ ok:true, days });
  } catch (e) {
    return res.status(500).json({ ok:false, error:e.message });
  }
});

// ---------- 허브 페이지 (테스트 프로젝트 카드) ----------
router.get('/hub', (req, res) => {
  // tests 폴더 하위 1-depth 디렉터리를 카드로 노출
  const testsDir = path.join(__dirname, '..', 'tests');
  let cards = [];
  try {
    if (fs.existsSync(testsDir)) {
      cards = fs.readdirSync(testsDir, { withFileTypes: true })
        .filter(d => d.isDirectory()).map(d => ({
          id: d.name,
          title: d.name,
          url: `/app/result/demo1?src=${encodeURIComponent(d.name)}`
        }));
    }
  } catch(_) {}
  res.render('hub', { cards });
});

// ---------- SEO & Site Management ----------
router.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send([
    'User-agent: *',
    'Disallow: /app/',
    'Allow: /r/',
    'Sitemap: ' + (process.env.SITE_URL || 'http://localhost:' + (process.env.PORT || 3004)) + '/sitemap.xml'
  ].join('\n'));
});

router.get('/sitemap.xml', (_req, res) => {
  const site = process.env.SITE_URL || 'http://localhost:' + (process.env.PORT || 3004);
  const paid = store.list(store._files.orders).filter(o => (o.kind || '').startsWith('order') && (o.stage === 'PAID'));
  const ids = [...new Set(paid.map(o => o.orderId))].slice(-200); // 최근 200개
  const urls = ids.map(id => `<url><loc>${site}/r/${id}</loc><changefreq>weekly</changefreq></url>`).join('');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
});

// ---------- Policy Pages ----------
router.get('/privacy', (_req, res) => res.render('policy_privacy'));
router.get('/terms', (_req, res) => res.render('policy_terms'));

// ---------- Admin Status Dashboard ----------
router.get('/admin/status', (req, res) => {
  const pass = (req.query.pass || '').toString();
  if (pass !== (process.env.ADMIN_PASS || '')) return res.status(401).send('unauthorized');

  const orders = store.list(store._files.orders);
  const coupons = store.list(store._files.coupons);
  const events = store.list(store._files.events);

  const stat = {
    orders_total: orders.length,
    orders_paid: orders.filter(o => o.stage === 'PAID').length,
    orders_canceled: orders.filter(o => o.stage === 'CANCELED').length,
    coupons_issued: coupons.filter(c => c.kind === 'coupon_issue').length,
    coupons_redeemed: coupons.filter(c => c.kind === 'coupon_redeem').length,
    last_backup: (() => {
      const dir = path.join(__dirname, 'data', 'backup');
      try {
        const files = fs.readdirSync(dir).map(f => ({
          f,
          t: fs.statSync(path.join(dir, f)).mtimeMs
        }));
        files.sort((a, b) => b.t - a.t);
        return files[0] ? new Date(files[0].t).toISOString() : null;
      } catch(_) {
        return null;
      }
    })()
  };

  res.json(stat);
});

// ---------- Metrics ----------
router.get('/api/metrics', (req, res) => {
  // 메트릭스 엔드포인트 보호 (Bearer 토큰 인증)
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.METRICS_TOKEN;

  if (expectedToken && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedToken)) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const format = (req.query.format || 'json').toString().toLowerCase();

  if (format === 'prometheus') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics.toPrometheus());
  } else {
    res.json(metrics.getAll());
  }
});

// ---------- Referral Analytics ----------
router.get('/api/analytics/referrals', (req, res) => {
  // 관리자 권한 확인 (Bearer 토큰)
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.ANALYTICS_TOKEN || process.env.METRICS_TOKEN;

  if (expectedToken && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedToken)) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30*24*60*60*1000); // 기본 30일
    const toDate = to ? new Date(to) : new Date();

    // 추천 성과 데이터 수집
    const referralStats = store.getReferralAnalytics(fromDate, toDate);

    res.json({
      success: true,
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      analytics: referralStats
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    res.status(500).json({ error: 'ANALYTICS_ERROR' });
  }
});

// ---------- Web Vitals ----------
router.post('/api/vitals', (req, res) => {
  try {
    const { name, value, rating, url, timestamp, userAgent } = req.body || {};

    // Log Web Vitals data for monitoring
    store.logEvent({
      kind: 'web_vitals',
      name: String(name || 'unknown'),
      value: Number(value || 0),
      rating: String(rating || 'unknown'),
      url: String(url || '/'),
      timestamp: Number(timestamp || Date.now()),
      userAgent: String(userAgent || '').slice(0, 200)
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('[web-vitals] error:', error);
    res.status(500).json({ error: 'Failed to record vitals' });
  }
});

// ---------- Dynamic OG Image ----------
const { Resvg } = require('@resvg/resvg-js');
const satori = require('satori');

const FONT_PATH = path.join(__dirname, 'assets', 'fonts', 'NotoSansKR-Regular.ttf');
let FONT_DATA = null;
try {
  FONT_DATA = fs.readFileSync(FONT_PATH);
} catch {
  console.warn('[og] font missing:', FONT_PATH);
}

const PERSONA = {
  PJEM: { name: '통찰력 있는 전략가', bg: 'linear-gradient(135deg,#0ea5e9,#22d3ee)' },
  RJEM: { name: '신뢰를 주는 리더', bg: 'linear-gradient(135deg,#0ea5e9,#84cc16)' },
  RFEM: { name: '에너자이저 활동가', bg: 'linear-gradient(135deg,#f97316,#fde047)' },
  PJAM: { name: '예술적 이상주의자', bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
  RFAM: { name: '자유로운 탐험가', bg: 'linear-gradient(135deg,#f59e0b,#10b981)' },
  RJAM: { name: '카리스마 리더', bg: 'linear-gradient(135deg,#ef4444,#f97316)' },
  PJIM: { name: '논리적 건축가', bg: 'linear-gradient(135deg,#6366f1,#06b6d4)' },
  RFIM: { name: '호기심 많은 혁신가', bg: 'linear-gradient(135deg,#84cc16,#22d3ee)' },
  RJIM: { name: '조직적 관리자', bg: 'linear-gradient(135deg,#059669,#0ea5e9)' },
  PJEM_ALT: { name: '꼼꼼한 분석가', bg: 'linear-gradient(135deg,#374151,#6b7280)' },
  RJEM_ALT: { name: '따뜻한 조력자', bg: 'linear-gradient(135deg,#dc2626,#f59e0b)' },
  RFEM_ALT: { name: '즐거운 엔터테이너', bg: 'linear-gradient(135deg,#7c3aed,#ec4899)' },
  PJAM_ALT: { name: '깊이 있는 조언자', bg: 'linear-gradient(135deg,#0f172a,#1e293b)' },
  RFAM_ALT: { name: '모험을 즐기는 자', bg: 'linear-gradient(135deg,#15803d,#facc15)' },
  RJAM_ALT: { name: '열정적 운동가', bg: 'linear-gradient(135deg,#dc2626,#ea580c)' },
  DEFAULT: { name: 'MindQuiz 결과', bg: 'linear-gradient(135deg,#111827,#374151)' }
};

function fitText(t, max=32){ return (t||'').toString().slice(0, max); }

router.get('/api/og', async (req, res) => {
  try {
    const type = (req.query.type || '').toString().trim().toUpperCase();
    const persona = fitText(req.query.persona || PERSONA[type]?.name || 'MindQuiz');
    const meme = fitText(req.query.meme || '');
    const name = fitText(req.query.name || '');
    const bg = PERSONA[type]?.bg || PERSONA.DEFAULT.bg;

    const width = 1200, height = 630;

    const svg = await satori({
      type: 'div',
      props: {
        style: {
          width, height, display:'flex', flexDirection:'column',
          backgroundImage: bg, color: '#fff', fontFamily: 'NotoSansKR'
        },
        children: [
          { type:'div', props: { style:{ padding:'40px' }, children: [
            { type:'div', props:{ style:{ fontSize: 24, opacity: 0.9 }, children: 'MindQuiz 결과' } },
            { type:'div', props:{ style:{ fontSize: 72, fontWeight: 800, marginTop: 8 }, children: type || 'PERSONA' } },
            { type:'div', props:{ style:{ fontSize: 36, marginTop: 8 }, children: persona } },
            meme ? { type:'div', props:{ style:{ fontSize: 28, marginTop: 16, opacity:0.95 }, children: `"${meme}"` }} : null,
          ].filter(Boolean)}},
          { type:'div', props:{ style:{ marginTop:'auto', padding:'32px 40px', display:'flex', justifyContent:'space-between', alignItems:'center' }, children: [
            { type:'div', props:{ style:{ fontSize: 24, opacity:0.9 }, children: name ? `${name}님의 결과` : 'mindquiz.app' } },
            { type:'div', props:{ style:{ fontSize: 20, opacity:0.8 }, children: '나의 4글자 코드로 증명하기' } },
          ]}}
        ]
      }
    }, {
      width, height, fonts: FONT_DATA ? [{ name:'NotoSansKR', data: FONT_DATA, weight: 400, style: 'normal' }] : []
    });

    const png = new Resvg(svg, { fitTo: { mode:'width', value: 1200 }}).render().asPng();
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=600');
    return res.send(png);
  } catch (e) {
    console.error('[og]', e);
    return res.status(500).send('og_error');
  }
});

// ---------- Version/Build Info ----------
router.get('/api/version', (_req, res) => {
  res.json({
    version: process.env.APP_VERSION || 'dev',
    commit: process.env.GIT_SHA || 'local',
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

module.exports = router;