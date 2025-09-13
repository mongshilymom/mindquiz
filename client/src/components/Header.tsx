export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-semibold text-foreground">
            Mind Quiz
          </h1>
        </div>
      </div>
    </header>
  );
}