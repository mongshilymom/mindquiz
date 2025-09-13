interface HeroProps {
  title: string;
  subtitle: string;
}

export default function Hero({ title, subtitle }: HeroProps) {
  return (
    <div className="text-center mb-12">
      <h1 
        className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
        data-testid="text-main-title"
      >
        {title}
      </h1>
      <p 
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        data-testid="text-subtitle"
      >
        {subtitle}
      </p>
    </div>
  );
}