/**
 * Cinematic Movie-Like Animation Pack
 * Real animations just like a movie: parallax, film grain, lens flare, spotlight, typewriter, Ken Burns, etc
 */
import { useEffect, useRef, useState, ReactNode } from "react";

// Film grain overlay
export function FilmGrain() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] opacity-[0.035] mix-blend-multiply">
      <div className="absolute inset-0 animate-film-grain bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
    </div>
  );
}

// Lens flare
export function LensFlare({ x = 20, y = 30 }: { x?: number; y?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-30 animate-lens-flare"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          background: `radial-gradient(circle, rgba(251, 191, 36, 0.8) 0%, rgba(245, 158, 11, 0.4) 20%, transparent 70%)`
        }}
      />
      <div className="absolute left-[30%] top-[50%] w-[200px] h-[1px] bg-gradient-to-r from-transparent via-amber-300/50 to-transparent rotate-12 animate-shimmer-line" />
    </div>
  );
}

// Spotlight following mouse
export function SpotlightCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(251,191,36,0.15), transparent 80%)`
        }}
      />
      {children}
    </div>
  );
}

// Parallax layer
export function ParallaxLayer({ children, speed = 0.5, className = "" }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const prog = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      setY((prog - 0.5) * speed * 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);
  return (
    <div ref={ref} className={className} style={{ transform: `translate3d(0, ${y}px, 0)` }}>
      {children}
    </div>
  );
}

// Typewriter effect
export function TypewriterText({ text, speed = 40, className = "", onDone }: { text: string; speed?: number; className?: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onDone]);
  return <span className={className}>{displayed}<span className="animate-blink">|</span></span>;
}

// Cinematic reveal (like movie credits reveal with 3D)
export function CinematicReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) setVisible(true);
      });
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="will-change-transform"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "perspective(1000px) rotateX(0) translateY(0) scale(1)" : "perspective(1000px) rotateX(12deg) translateY(50px) scale(0.96)",
        filter: visible ? "blur(0)" : "blur(8px)",
        transition: `all 1200ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

// Ken Burns image
export function KenBurnsImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-cover animate-ken-burns" loading="lazy" />
    </div>
  );
}

// Counting number animation
export function CountUp({ target, suffix = "", prefix = "", duration = 2000, className = "" }: { target: number; suffix?: string; prefix?: string; duration?: number; className?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) setStarted(true);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  return <span ref={ref} className={className}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// Particle field canvas
export function ParticleField({ count = 80 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 1.8 + 0.3,
        o: Math.random() * 0.5 + 0.2
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    let raf = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${p.o})`;
        ctx.fill();
      });
      // connect nearby
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(251,191,36,${0.12 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// Movie title card
export function MovieTitleCard({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="relative text-center py-12">
      <div className="absolute left-1/2 -top-4 h-[1px] w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      <div className="text-[10px] tracking-[0.4em] font-black text-amber-400/70 uppercase animate-title-eyebrow">{eyebrow}</div>
      <h2 className="mt-4 text-4xl md:text-6xl font-black tracking-tight leading-[0.9] text-white animate-title-reveal">
        {title.split(" ").map((word, i) => (
          <span key={i} className="inline-block mr-[0.2em] animate-word-rise" style={{ animationDelay: `${i * 120}ms` }}>{word}</span>
        ))}
      </h2>
      {subtitle && <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-sm md:text-base animate-fade-in-delayed">{subtitle}</p>}
      <div className="absolute left-1/2 -bottom-4 h-[1px] w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
    </div>
  );
}

// Infinite horizontal scroller like film reel
export function FilmReelTicker({ items }: { items: string[] }) {
  const doubled = [...items, ...items];
  return (
    <div className="marquee-mask overflow-hidden py-3 bg-black/40 border-y border-amber-500/10">
      <div className="flex w-max gap-8 animate-marquee-fast">
        {doubled.map((t, i) => (
          <span key={i} className="flex items-center gap-3 text-amber-300/80 text-xs font-mono uppercase tracking-widest whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}
