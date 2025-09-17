import React from 'react';
import { shareKakaoLink } from '../utils/kakao';
import { gtagEvent, GA4_EVENTS } from '../utils/gtag';

type Props = { shareUrl: string; ogImage: string; title: string; description: string; };

export default function ShareBar({ shareUrl, ogImage, title, description }: Props) {
  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    gtagEvent(GA4_EVENTS.SHARE_LINK, { page: location.pathname });
    alert('링크가 복사되었습니다!');
  };
  const x = () => {
    const u = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
    window.open(u, '_blank'); gtagEvent(GA4_EVENTS.SHARE_X, { page: location.pathname });
  };
  const line = () => {
    const u = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(u, '_blank');
  };
  const fb = () => {
    const u = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(u, '_blank');
  };
  const mail = () => {
    const u = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`;
    location.href = u;
  };
  const save = () => {
    const a = document.createElement('a'); a.href = ogImage; a.download = 'mindquiz.png'; a.click();
  };

  return (
    <div className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b">
      <div className="max-w-3xl mx-auto px-4 py-2 flex gap-2">
        <button onClick={()=>shareKakaoLink(shareUrl, title, description, ogImage)} className="px-3 py-2 rounded-lg border">카카오톡</button>
        <button onClick={x} className="px-3 py-2 rounded-lg border">X</button>
        <button onClick={line} className="px-3 py-2 rounded-lg border">라인</button>
        <button onClick={fb} className="px-3 py-2 rounded-lg border">페북</button>
        <button onClick={mail} className="px-3 py-2 rounded-lg border">이메일</button>
        <button onClick={copy} className="px-3 py-2 rounded-lg border">링크복사</button>
        <button onClick={save} className="ml-auto px-3 py-2 rounded-lg border">결과 이미지 저장</button>
      </div>
    </div>
  );
}