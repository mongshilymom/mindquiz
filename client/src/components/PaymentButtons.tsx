import React, { useState } from 'react';
import { gtagEvent, GA4_EVENTS } from '../utils/gtag';

type Props = {
  orderId: string;
  itemName: string;
  amount: number;
  couponCode?: string | null;
  provider?: 'kakao' | 'naver';
};

export default function PaymentButtons({ orderId, itemName, amount, couponCode }: Props) {
  const [busy, setBusy] = useState(false);

  async function start(provider: 'kakao'|'naver') {
    try {
      setBusy(true);
      // 1) 서버 서명 받기
      const sigRes = await fetch('/api/order/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, itemName, amount })
      }).then(r=>r.json());
      if (!sigRes?.sig) throw new Error('sign failed');

      // 2) ready 호출
      const url = provider === 'kakao' ? '/api/payment/kakao/ready' : '/api/payment/naver/ready';
      const payload: any = { orderId, itemName, amount, sig: sigRes.sig };
      if (couponCode) payload.couponCode = couponCode;

      const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const data = await r.json();
      if (!r.ok || !data.redirect_url) throw new Error(data.error || 'ready error');

      // 3) 리다이렉트
      location.href = data.redirect_url;
    } catch (e:any) {
      alert(e.message || '결제 시작 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button disabled={busy} onClick={()=>start('kakao')} className="h-11 rounded-lg bg-[#FEE500] font-semibold">
        카카오페이로 결제
      </button>
      <button disabled={busy} onClick={()=>start('naver')} className="h-11 rounded-lg bg-[#03C75A] text-white font-semibold">
        네이버페이로 결제
      </button>
    </div>
  );
}