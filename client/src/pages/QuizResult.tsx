import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Share2, Download } from 'lucide-react';


export default function QuizResult() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/quiz-result/:id');
  const [isPremium, setIsPremium] = useState(false);

  // URL 파라미터에서 premium과 reportId 확인
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const premium = searchParams.get('premium') === 'true';
    const reportId = searchParams.get('reportId');
    setIsPremium(premium && !!reportId);
  }, []);

  // SEO 메타데이터 설정
  useEffect(() => {
    document.title = '퀴즈 결과 - 마인드 퀴즈';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '당신만의 성격 유형과 특징을 확인해보세요. 상세한 분석과 맞춤형 추천을 받아보실 수 있습니다.');
    }
  }, []);

  // 퀴즈 결과 조회
  const { data: quizResult, isLoading } = useQuery({
    queryKey: ['/api/quiz-results', params?.id],
    enabled: !!params?.id
  });

  // 프리미엄 리포트 조회
  const { data: premiumReport, isLoading: isPremiumLoading } = useQuery({
    queryKey: ['/api/premium-reports', params?.id],
    enabled: isPremium && !!params?.id
  });

  const handleShare = () => {
    const shareData = {
      title: `나는 ${quizResult?.persona}! - 마인드 퀴즈`,
      text: `${quizResult?.type} 성격 유형 결과를 확인해보세요!`,
      url: window.location.href.split('?')[0] // Remove premium params for sharing
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };

  const handlePurchasePremium = () => {
    if (params?.id) {
      setLocation(`/payment/${params.id}`);
    }
  };

  if (!match) {
    return <div>잘못된 접근입니다.</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">로딩 중...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!quizResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        <div className="container mx-auto px-6 py-16">
          <div className="text-center">퀴즈 결과를 찾을 수 없습니다.</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 기본 결과 */}
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-lg px-4 py-2" data-testid="badge-result-type">
                {quizResult.type}
              </Badge>
              <h1 className="text-3xl font-bold text-gray-800" data-testid="text-persona">
                {quizResult.persona}
              </h1>
              <p className="text-xl text-gray-600 italic" data-testid="text-meme">
                "{quizResult.meme}"
              </p>
              <p className="text-gray-700 max-w-2xl mx-auto" data-testid="text-description">
                {quizResult.description}
              </p>
              
              <div className="flex justify-center gap-4 mt-6">
                <Button onClick={handleShare} variant="outline" data-testid="button-share">
                  <Share2 className="w-4 h-4 mr-2" />
                  결과 공유하기
                </Button>
              </div>
            </div>
          </Card>

          {/* 프리미엄 섹션 */}
          {isPremium && premiumReport && !isPremiumLoading ? (
            <Card className="p-8">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-800" data-testid="text-premium-title">
                  프리미엄 상세 분석
                </h2>
                <Badge variant="default" className="bg-yellow-500">
                  Premium
                </Badge>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">상세 분석</h3>
                  <div 
                    className="text-gray-700 whitespace-pre-line leading-relaxed"
                    data-testid="text-detailed-analysis"
                  >
                    {premiumReport.reportData.detailedAnalysis}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">맞춤 추천사항</h3>
                  <ul className="space-y-2" data-testid="list-recommendations">
                    {premiumReport.reportData.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">추천 직업군</h3>
                  <div className="flex flex-wrap gap-2" data-testid="list-career-suggestions">
                    {premiumReport.reportData.careerSuggestions.map((career, index) => (
                      <Badge key={index} variant="outline">
                        {career}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : !isPremium && (
            <Card className="p-8 text-center border-2 border-dashed border-yellow-300 bg-yellow-50">
              <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2" data-testid="text-premium-offer">
                더 상세한 분석이 궁금하다면?
              </h3>
              <p className="text-gray-600 mb-4">
                프리미엄 리포트로 당신만의 상세한 성격 분석, 맞춤 추천사항, 그리고 커리어 가이드를 받아보세요!
              </p>
              <Button 
                onClick={handlePurchasePremium}
                className="bg-yellow-500 hover:bg-yellow-600"
                data-testid="button-purchase-premium"
              >
                <Crown className="w-4 h-4 mr-2" />
                프리미엄 리포트 구매하기
              </Button>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}