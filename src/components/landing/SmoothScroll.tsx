import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getScrollOffset } from '../../lib/scroll';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    window.__lenis = lenis;

    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      window.dispatchEvent(new CustomEvent('lenis-scroll', { detail: scroll }));
    });

    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onAnchorClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.('a[href^="#"]');
      if (!link || !(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: getScrollOffset() });
    };

    document.addEventListener('click', onAnchorClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onAnchorClick);
      lenis.destroy();
      delete window.__lenis;
    };
  }, [reduced]);

  return <>{children}</>;
}
