interface HeroProps {
  title: string;
  subtitle: string;
}

export default function Hero({ title, subtitle }: HeroProps) {
  return (
    <div className="text-center mb-16">
      <h1 
        className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 font-display"
        data-testid="text-main-title"
      >
        {title}
      </h1>
      <p 
        className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium"
        data-testid="text-subtitle"
      >
        {subtitle}
      </p>
    </div>
  );
}