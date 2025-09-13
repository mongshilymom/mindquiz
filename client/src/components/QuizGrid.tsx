import QuizCard from './QuizCard';

interface Quiz {
  title: string;
  url: string;
  description: string;
}

const quizzes: Quiz[] = [
  {
    title: "MBTI",
    url: "https://mbti.mindquiz.app",
    description: "16가지 성격 유형 중 나는 어떤 타입일까요?"
  },
  {
    title: "테토젠",
    url: "https://tetoegen.mindquiz.app", 
    description: "창의적 사고와 문제 해결 능력을 테스트해보세요"
  },
  {
    title: "클루피",
    url: "https://kloopi.mindquiz.app",
    description: "감정의 패턴과 심리 상태를 분석합니다"
  },
  {
    title: "디시전",
    url: "https://dicision.mindquiz.app",
    description: "결정을 내리는 방식과 선택의 기준을 알아봅니다"
  },
  {
    title: "라이프초이스",
    url: "https://lifechoice.mindquiz.app",
    description: "인생의 가치관과 우선순위를 탐색해보세요"
  },
  {
    title: "퍼스트클릭",
    url: "https://firstclick.mindquiz.app",
    description: "첫 직감과 무의식적 선택의 의미를 발견합니다"
  }
];

export default function QuizGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {quizzes.map((quiz) => (
        <QuizCard
          key={quiz.title}
          title={quiz.title}
          url={quiz.url}
          description={quiz.description}
        />
      ))}
    </div>
  );
}