import Hero from '../components/Hero';
import QuizGrid from '../components/QuizGrid';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <Hero 
          title="마인드 퀴즈"
          subtitle="당신의 마음을 탐험하는 시간, 원하는 퀴즈를 선택해 시작해보세요!"
        />
        <QuizGrid />
      </div>
    </div>
  );
}