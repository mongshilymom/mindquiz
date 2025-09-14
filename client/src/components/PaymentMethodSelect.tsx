import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PaymentMethodSelectProps {
  onKakaoPayClick: () => void;
  onNaverPayClick: () => void;
  amount: number;
  reportType: string;
  quizResult?: {
    type: string;
    persona: string;
  };
}

export default function PaymentMethodSelect({ 
  onKakaoPayClick, 
  onNaverPayClick, 
  amount, 
  reportType, 
  quizResult 
}: PaymentMethodSelectProps) {
  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      {/* 구매 내역 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4" data-testid="text-payment-title">
          유료 심화 리포트 구매
        </h3>
        
        {quizResult && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">퀴즈 결과</p>
            <p className="font-semibold text-gray-800" data-testid="text-quiz-result">
              {quizResult.type} - {quizResult.persona}
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">리포트 유형</span>
            <span className="font-medium" data-testid="text-report-type">{reportType}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">결제 금액</span>
            <span className="text-lg font-bold text-gray-800" data-testid="text-amount">
              {amount.toLocaleString()}원
            </span>
          </div>
        </div>
      </Card>

      {/* 결제 수단 선택 */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-800">결제 수단을 선택해주세요</h4>
        
        {/* 카카오페이 버튼 */}
        <Button
          onClick={onKakaoPayClick}
          size="lg"
          className="w-full bg-[#FEE500] text-black border-[#E6D400] font-semibold hover-elevate active-elevate-2 flex items-center justify-center gap-3"
          data-testid="button-kakao-pay"
          aria-label="카카오페이로 결제하기"
        >
          <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
            <span className="text-[#FEE500] text-xs font-bold">K</span>
          </div>
          카카오페이로 결제
        </Button>
        
        {/* 네이버페이 버튼 */}
        <Button
          onClick={onNaverPayClick}
          size="lg"
          className="w-full bg-[#03C75A] text-white border-[#02B050] font-semibold hover-elevate active-elevate-2 flex items-center justify-center gap-3"
          data-testid="button-naver-pay"
          aria-label="네이버페이로 결제하기"
        >
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <span className="text-[#03C75A] text-sm font-bold">N</span>
          </div>
          네이버페이로 결제
        </Button>
      </div>

      {/* 안내사항 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• 결제 완료 후 즉시 상세한 심화 리포트를 받아보실 수 있습니다.</p>
        <p>• 결제 취소는 구매 후 7일 이내 가능합니다.</p>
        <p>• 결제 관련 문의사항은 고객센터로 연락주세요.</p>
      </div>
    </div>
  );
}