import PaymentMethodSelect from '../PaymentMethodSelect';

export default function PaymentMethodSelectExample() {
  const handleKakaoPay = () => console.log('카카오페이 클릭');
  const handleNaverPay = () => console.log('네이버페이 클릭');

  const mockQuizResult = {
    type: "INTJ",
    persona: "통찰력 있는 전략가"
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <PaymentMethodSelect
        onKakaoPayClick={handleKakaoPay}
        onNaverPayClick={handleNaverPay}
        amount={9900}
        reportType="심화 분석 리포트"
        quizResult={mockQuizResult}
      />
    </div>
  );
}