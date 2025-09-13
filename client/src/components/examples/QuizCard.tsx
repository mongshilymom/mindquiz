import QuizCard from '../QuizCard';

export default function QuizCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <QuizCard 
        title="MBTI" 
        url="https://mbti.mindquiz.app"
        description="나의 성격 유형을 알아보세요"
      />
      <QuizCard 
        title="테토젠" 
        url="https://tetoegen.mindquiz.app"
        description="창의적 사고 능력을 테스트해보세요"
      />
      <QuizCard 
        title="클루피" 
        url="https://kloopi.mindquiz.app"
        description="당신의 감정 패턴을 분석합니다"
      />
    </div>
  );
}