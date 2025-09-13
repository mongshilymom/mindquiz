import Header from '../components/Header';
import Hero from '../components/Hero';
import QuizGrid from '../components/QuizGrid';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-br from-emerald-200 to-cyan-200 rounded-full opacity-20 blur-xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <Hero 
            title="마인드 퀴즈"
            subtitle="당신의 마음을 탐험하는 시간, 원하는 퀴즈를 선택해 시작해보세요!"
          />
          <QuizGrid />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}