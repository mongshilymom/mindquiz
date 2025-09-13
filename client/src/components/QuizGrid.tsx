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
    description: "16가지 유형으로 알아보는 진짜 '나' 발견하기"
  },
  {
    title: "테토 에겐",
    url: "https://tetoegen.mindquiz.app", 
    description: "나만의 애착 유형 진단"
  },
  {
    title: "KLoopi",
    url: "https://kloopi.mindquiz.app",
    description: "나는 깊게 몰입할까, 멀티태스킹에 능할까?"
  },
  {
    title: "결정 나침반",
    url: "https://dicision.mindquiz.app",
    description: "갈림길에서 나는 어떤 선택을 내리는 사람일까?"
  },
  {
    title: "Life Choice",
    url: "https://lifechoice.mindquiz.app",
    description: "내 인생에서 가장 중요한 가치는 무엇일까?"
  },
  {
    title: "First Click",
    url: "https://firstclick.mindquiz.app",
    description: "아침에 일어나자마자 작은 성취감으로 주는 보상"
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