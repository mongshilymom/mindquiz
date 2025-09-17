export function shareKakaoLink(url: string, title: string, description: string, imageUrl: string) {
  const K = (window as any).Kakao;
  if (!K || !K.isInitialized?.()) { alert('Kakao SDK not ready'); return; }
  K.Share.sendDefault({
    objectType: 'feed',
    content: { title, description, imageUrl, link: { mobileWebUrl: url, webUrl: url } },
    buttons: [{ title: '결과 보기', link: { mobileWebUrl: url, webUrl: url } }]
  });
}