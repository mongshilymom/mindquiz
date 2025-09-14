import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import PaymentMethodSelect from '../components/PaymentMethodSelect';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Mock data for demonstration
const mockQuizResult = {
  id: "test-quiz-result-1",
  type: "INTJ",
  persona: "통찰력 있는 전략가",
  quizType: "MBTI",
  meme: "큰 그림을 그리는 사람"
};

export default function Payment() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/payment/:quizResultId');

  // SEO 메타데이터 설정
  useEffect(() => {
    document.title = '심화 리포트 구매 - 마인드 퀴즈';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '당신만의 상세한 분석 리포트를 받아보세요. 안전하고 간편한 결제로 즉시 이용 가능합니다.');
    }
    
    return () => {
      document.title = '마인드 퀴즈';
    };
  }, []);
  
  // Mock data - TODO: Replace with actual API call
  const { data: quizResult, isLoading } = useQuery({
    queryKey: ['/api/quiz-results', params?.quizResultId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return mockQuizResult;
    },
    enabled: !!params?.quizResultId
  });

  const handleKakaoPayment = async () => {
    try {
      console.log('카카오페이 결제 시작:', {
        quizResultId: params?.quizResultId,
        amount: 9900,
        reportType: '심화 분석 리포트'
      });
      
      // 카카오페이 결제 준비 API 호출
      const response = await fetch('/api/payment/kakao/ready', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizResultId: params?.quizResultId,
          amount: 9900,
          reportType: '심화 분석 리포트'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // 카카오페이 결제 페이지로 리다이렉트 (데모에서는 Mock URL)
        console.log('카카오페이 결제 페이지로 리다이렉트:', result.redirectUrl);
        
        // 실제 환경에서는 다음과 같이 리다이렉트합니다:
        // window.location.href = result.redirectUrl;
        
        // 데모용: Mock 승인 페이지로 리다이렉트
        const mockApprovalUrl = `/api/payment/kakao/approve?payment_id=${result.paymentId}&pg_token=mock_pg_token`;
        window.location.href = mockApprovalUrl;
        
      } else {
        throw new Error(result.error || '결제 준비에 실패했습니다.');
      }
    } catch (error) {
      console.error('카카오페이 결제 오류:', error);
      alert('결제 처리 중 오류가 발생했습니다: ' + (error as Error).message);
    }
  };

  const handleNaverPayment = async () => {
    try {
      console.log('네이버페이 결제 시작:', {
        quizResultId: params?.quizResultId,
        amount: 9900,
        reportType: '심화 분석 리포트'
      });
      
      // 네이버페이 결제 준비 API 호출
      const response = await fetch('/api/payment/naver/ready', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizResultId: params?.quizResultId,
          amount: 9900,
          reportType: '심화 분석 리포트'
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // 네이버페이 결제 페이지로 리다이렉트 (데모에서는 Mock URL)
        console.log('네이버페이 결제 페이지로 리다이렉트:', result.redirectUrl);
        
        // 실제 환경에서는 다음과 같이 리다이렉트합니다:
        // window.location.href = result.redirectUrl;
        
        // 데모용: Mock 승인 페이지로 리다이렉트
        const mockApprovalUrl = `/api/payment/naver/approve?payment_id=${result.paymentId}&PaymentId=mock_payment_id_${Date.now()}`;
        window.location.href = mockApprovalUrl;
        
      } else {
        throw new Error(result.error || '결제 준비에 실패했습니다.');
      }
    } catch (error) {
      console.error('네이버페이 결제 오류:', error);
      alert('결제 처리 중 오류가 발생했습니다: ' + (error as Error).message);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2" data-testid="text-page-title">
            심화 리포트 구매
          </h1>
          <p className="text-gray-600">
            당신만의 상세한 분석 리포트를 받아보세요
          </p>
        </div>
        
        <PaymentMethodSelect
          onKakaoPayClick={handleKakaoPayment}
          onNaverPayClick={handleNaverPayment}
          amount={9900}
          reportType="심화 분석 리포트"
          quizResult={quizResult}
        />
      </main>
      
      <Footer />
    </div>
  );
}