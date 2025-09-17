// server/lib/pricing.cjs
// 서버 권한 가격표 + 쿠폰 적용

'use strict';

// 서버 권한 가격표
const SKU = {
  REPORT_BASE: 4900, // KRW
  REPORT_PREMIUM: 9900,
  EXPANSION_PACK: 2900
};

function priceForOrder({ type = 'REPORT_BASE' }) {
  return Number(SKU[type] || SKU.REPORT_BASE);
}

function applyCoupon(amount, coupon) {
  if (!coupon) return amount;

  const type = coupon.type || coupon.offer || '';

  // 10% 할인 쿠폰
  if (type === 'DISCOUNT_10') {
    return Math.max(0, Math.round(amount * 0.9));
  }

  // 확장팩 무료 제공 (본상품 가격은 유지)
  if (type === 'EXPANSION_PACK') {
    return amount; // 본상품 가격 유지, 확장팩 별도 제공
  }

  // 정액 할인
  if (type === 'FIXED_1000') {
    return Math.max(0, amount - 1000);
  }

  return amount;
}

function computeFinalAmount({ skuType, coupon }) {
  const base = priceForOrder({ type: skuType || 'REPORT_BASE' });
  return applyCoupon(base, coupon);
}

module.exports = {
  SKU,
  priceForOrder,
  applyCoupon,
  computeFinalAmount
};