interface PageHeaderProps {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
  children?: React.ReactNode;
}

export default function PageHeader({ eyebrow, title, highlight, description, children }: PageHeaderProps) {
  return (
    <section className="relative pt-36 pb-16 md:pt-44 md:pb-20 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/95 to-gray-950" />
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <span className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 mb-6">
          <span className="text-amber-300 text-sm font-medium tracking-wide uppercase">{eyebrow}</span>
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tight">
          {title}{" "}
          {highlight && (
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              {highlight}
            </span>
          )}
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">{description}</p>
        {children}
      </div>
    </section>
  );
}
