import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  brand?: 'naver' | 'kakao' | 'primary' | 'ghost';
  full?: boolean;
};

const brandMap = {
  naver: 'bg-[#03C75A] text-white hover:brightness-95',
  kakao: 'bg-[#FEE500] text-black hover:brightness-95',
  primary: 'bg-sky-600 text-white hover:bg-sky-700',
  ghost: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
};

export default function BrandButton({ brand='ghost', full, className='', ...rest }: Props){
  return (
    <button
      {...rest}
      className={[
        'h-11 rounded-xl px-4 transition-all disabled:opacity-60 disabled:cursor-not-allowed',
        full ? 'w-full' : '',
        brandMap[brand],
        className
      ].join(' ').trim()}
    />
  );
}