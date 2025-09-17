import { useEffect } from 'react';
import BrandButton from './BrandButton';

export default function StickyShare({ url, title, description, imageUrl }:{
  url:string; title:string; description:string; imageUrl:string;
}){
  useEffect(()=>{
    const K = (window as any).Kakao;
    if(!K){
      const s=document.createElement('script');
      s.src='https://developers.kakao.com/sdk/js/kakao.js';
      s.onload=()=> (window as any).Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY);
      document.head.appendChild(s);
    }
  }, []);

  const kakao=()=> (window as any).Kakao?.Share?.sendDefault({
    objectType:'feed',
    content:{ title, description, imageUrl, link:{ mobileWebUrl:url, webUrl:url } },
    buttons:[{ title:'결과 보기', link:{ mobileWebUrl:url, webUrl:url } }]
  });

  const copy=()=> navigator.clipboard.writeText(url).then(()=>alert('링크를 복사했어요!'));

  return (
    <div className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-2 flex gap-8 items-center">
        <div className="text-sm font-semibold text-slate-700">결과 공유하기</div>
        <div className="ml-auto flex gap-8">
          <BrandButton brand="kakao" onClick={kakao}>카카오톡</BrandButton>
          <BrandButton brand="primary" onClick={copy}>링크 복사</BrandButton>
        </div>
      </div>
    </div>
  );
}