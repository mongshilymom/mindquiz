const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = {
  orders: path.join(DATA_DIR, 'orders.ndjson'),
  coupons: path.join(DATA_DIR, 'coupons.ndjson'),
  events: path.join(DATA_DIR, 'events.ndjson'),
};
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
for (const f of Object.values(FILE)) if (!fs.existsSync(f)) fs.writeFileSync(f, '');

function append(file, obj) {
  fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), ...obj }) + '\n', 'utf8');
}
function lastBy(file, key, val) {
  const txt = fs.readFileSync(file, 'utf8');
  let out = null;
  for (const line of txt.trim().split('\n')) {
    if (!line) continue;
    const o = JSON.parse(line);
    if (o[key] === val) out = o;
  }
  return out;
}
function list(file, filter = () => true) {
  const txt = fs.readFileSync(file, 'utf8');
  const out = [];
  for (const line of txt.trim().split('\n')) {
    if (!line) continue;
    const o = JSON.parse(line);
    if (filter(o)) out.push(o);
  }
  return out;
}

/** Orders */
function saveOrder(order) { append(FILE.orders, { kind: 'order', ...order }); }
function updateOrder(orderId, patch) { append(FILE.orders, { kind: 'order_update', orderId, ...patch }); }
function getOrder(orderId) { return lastBy(FILE.orders, 'orderId', orderId); }

/** Coupons */
function issueCoupon(type, orderId) {
  // type: 'DISCOUNT_10' | 'EXPANSION_PACK'
  const code = ('MQ' + Date.now().toString(36) + Math.random().toString(36).slice(2,6)).toUpperCase();
  append(FILE.coupons, { kind: 'coupon_issue', code, type, orderId: orderId || null, state: 'ISSUED' });
  return code;
}
function getCoupon(code) { return lastBy(FILE.coupons, 'code', code); }
function holdCoupon(code, orderId) {
  const c = getCoupon(code); if (!c) return { ok:false, reason:'NOT_FOUND' };
  if (c.state === 'REDEEMED') return { ok:false, reason:'ALREADY_USED' };
  append(FILE.coupons, { kind:'coupon_hold', code, state:'HELD', orderId });
  return { ok:true };
}
function releaseCoupon(code) {
  const c = getCoupon(code); if (!c) return { ok:false, reason:'NOT_FOUND' };
  if (c.state !== 'HELD') return { ok:true }; // no-op
  append(FILE.coupons, { kind:'coupon_release', code, state:'ISSUED' });
  return { ok:true };
}
function redeemCoupon(code, orderId) {
  const c = getCoupon(code); if (!c) return { ok:false, reason:'NOT_FOUND' };
  append(FILE.coupons, { kind:'coupon_redeem', code, state:'REDEEMED', orderId });
  return { ok:true };
}

/** Events */
function logEvent(ev) { append(FILE.events, ev); }

/** Analytics */
function getReferralAnalytics(fromDate, toDate) {
  const fromTs = fromDate.getTime();
  const toTs = toDate.getTime();

  // 추천 관련 이벤트 수집
  const referralEvents = list(FILE.events, e =>
    e.ts >= fromTs && e.ts <= toTs &&
    (e.kind === 'referral_conversion' || e.kind === 'ga4_event')
  );

  // 쿠폰 발급/사용 통계
  const couponEvents = list(FILE.coupons, c =>
    c.ts >= fromTs && c.ts <= toTs
  );

  // 주문 데이터
  const orders = list(FILE.orders, o =>
    o.ts >= fromTs && o.ts <= toTs && o.kind === 'order'
  );

  // 통계 계산
  const totalReferrals = referralEvents.filter(e => e.kind === 'referral_conversion').length;
  const totalConversions = orders.filter(o => o.orderId && referralEvents.some(r => r.orderId === o.orderId)).length;
  const conversionRate = totalReferrals > 0 ? (totalConversions / totalReferrals * 100).toFixed(2) : 0;

  const revenueFromReferrals = orders
    .filter(o => referralEvents.some(r => r.orderId === o.orderId))
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  return {
    totalReferrals,
    totalConversions,
    conversionRate: `${conversionRate}%`,
    revenueFromReferrals,
    couponsIssued: couponEvents.filter(c => c.kind === 'coupon_issue').length,
    couponsRedeemed: couponEvents.filter(c => c.kind === 'coupon_redeem').length,
    recentEvents: referralEvents.slice(-10)
  };
}

module.exports = {
  // orders
  saveOrder, updateOrder, getOrder,
  // coupons
  issueCoupon, getCoupon, holdCoupon, releaseCoupon, redeemCoupon,
  // events
  logEvent,
  // analytics
  getReferralAnalytics,
  // for admin
  _files: FILE, list,
};