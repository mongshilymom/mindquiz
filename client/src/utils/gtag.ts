export const GA4_EVENTS = {
  PURCHASE_COMPLETE: 'purchase_complete',
  SHARE_KAKAO: 'share_kakao',
  SHARE_LINK: 'share_link',
  SHARE_X: 'share_x',
  SHARE_LINE: 'share_line',
  COUPON_ISSUED: 'coupon_issued',
  COUPON_APPLIED: 'coupon_applied',
  COUPON_RELEASED: 'coupon_released'
} as const;

export function gtagEvent(name: string, params: Record<string, any> = {}) {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  (window as any).gtag('event', name, params);
}