import { ExternalLink } from "lucide-react";

interface QuizCardProps {
  title: string;
  url: string;
  description?: string;
}

export default function QuizCard({ title, url, description }: QuizCardProps) {
  const handleClick = () => {
    console.log(`Navigating to ${title} quiz: ${url}`);
    window.open(url, '_blank');
  };

  return (
    <div 
      className="bg-card rounded-lg p-6 border border-card-border hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      onClick={handleClick}
      data-testid={`card-quiz-${title.toLowerCase()}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-card-foreground">
          {title}
        </h3>
        <ExternalLink className="w-5 h-5 text-muted-foreground" />
      </div>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}