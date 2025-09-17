import React, { useMemo } from 'react';
import PaymentButtons from '../components/PaymentButtons';
import ShareBar from '../components/ShareBar';

export default function ResultPage() {
  const params = new URLSearchParams(location.search);
  const id = location.pathname.split('/').pop() || 'demo1';
  const type = params.get('type') || 'PJEM';
  const persona = params.get('persona') || '통찰력 있는 전략가';
  const meme = params.get('meme') || '피젬';
  const name = params.get('name') || '';

  const site = import.meta.env.VITE_SITE_URL || location.origin;
  const shareUrl = `${site}/r/${id}`;
  const ogImage = `${site}/api/og?type=${encodeURIComponent(type)}&persona=${encodeURIComponent(persona)}&meme=${encodeURIComponent(meme)}&name=${encodeURIComponent(name)}&v=${Date.now()}`;

  const amount = 4900;
  const itemName = `MindQuiz 리포트 - ${type}`;
  const couponCode = params.get('coupon') || '';

  return (
    <div>
      <ShareBar shareUrl={shareUrl} ogImage={ogImage} title={`내 코드 ${type}`} description={`${persona} - ${meme}`} />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold">{type} — {persona}</h1>
        <p className="mt-2 opacity-80">"{meme}"</p>

        <img src={ogImage} alt="OG" className="mt-6 w-full rounded-xl border" />

        <section className="mt-8">
          <h2 className="text-xl font-semibold">유료 리포트</h2>
          <p className="opacity-70">더 깊은 분석을 받아보세요.</p>
          <div className="mt-3">
            <PaymentButtons orderId={id} itemName={itemName} amount={amount} couponCode={couponCode || undefined} />
          </div>
        </section>
      </main>
    </div>
  );
}