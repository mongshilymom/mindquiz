import { User, Lightbulb, Smile, GitBranch, CheckSquare, MousePointer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizCardProps {
  title: string;
  url: string;
  description?: string;
  accentColor?: string;
}

const iconMap = {
  "MBTI": User,
  "Teto Egen": Lightbulb,
  "KLoopi": Smile,
  "Decision": GitBranch,
  "Life Choice": CheckSquare,
  "First Click": MousePointer,
};

const colorMap = {
  "MBTI": "border-blue-400",
  "Teto Egen": "border-amber-400",
  "KLoopi": "border-pink-400",
  "Decision": "border-emerald-400",
  "Life Choice": "border-purple-400",
  "First Click": "border-cyan-400",
};

export default function QuizCard({ title, url, description }: QuizCardProps) {
  const IconComponent = iconMap[title as keyof typeof iconMap] || User;
  const borderColor = colorMap[title as keyof typeof colorMap] || "border-blue-400";
  
  const handleClick = () => {
    console.log(`Navigating to ${title} quiz: ${url}`);
    window.open(url, '_blank');
  };

  return (
    <div 
      className={`bg-white/90 backdrop-blur-sm rounded-xl border-t-4 ${borderColor} border border-white/40 shadow-lg hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden group cursor-pointer`}
      onClick={handleClick}
      data-testid={`card-quiz-${title.toLowerCase()}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-md">
            <IconComponent className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 text-center mb-3">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 text-center leading-relaxed mb-6">
            {description}
          </p>
        )}
        
        <div className="flex justify-center">
          <Button 
            variant="default"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg group-hover:scale-105"
            data-testid={`button-start-${title.toLowerCase()}`}
          >
            퀴즈 시작하기
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}