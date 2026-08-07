import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

type Direction = "up" | "left" | "right" | "zoom" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Direction the element animates in from. Default "up". */
  direction?: Direction;
  /** Extra transition delay in ms — use for staggering cards. */
  delay?: number;
  as?: "div" | "section" | "span" | "li" | "article" | "figure";
}

/**
 * Scroll-reveal wrapper: the child fades/slides in the first time it enters
 * the viewport (IntersectionObserver). Respects prefers-reduced-motion via CSS.
 */
export default function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const dirClass =
    direction === "up"
      ? "reveal-up"
      : direction === "left"
        ? "reveal-left"
        : direction === "right"
          ? "reveal-right"
          : direction === "zoom"
            ? "reveal-zoom"
            : "reveal-none";

  return (
    <Tag
      ref={ref as any}
      className={cn("reveal", dirClass, visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
