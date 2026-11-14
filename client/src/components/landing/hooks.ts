import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { useApp } from '../../context/AppContext';
import { telegramLink } from '../../lib/contact';
import { landing } from '../../locales/landing';

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useLanding() {
  const { language, enterDemo, t, status } = useApp();
  return { language, t, copy: landing[language], enterDemo, signedIn: status === 'ready', contactHref: telegramLink(t.telegramMessage) };
}

export function useInView<T extends HTMLElement>(threshold = 0.15): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(reducedMotion);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return [ref, inView];
}

export function useCountUp(target: number, active: boolean, duration = 1400): number {
  const [value, setValue] = useState(reducedMotion() ? target : 0);

  useEffect(() => {
    if (!active) return;
    if (reducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}

export function useScrollProgress(barRef: RefObject<HTMLElement | null>): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      setScrolled(window.scrollY > 12);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [barRef]);

  return scrolled;
}

export function useTilt<T extends HTMLElement>(maxDegrees = 6) {
  const ref = useRef<T>(null);
  return {
    ref,
    onMouseMove: (e: MouseEvent) => {
      const el = ref.current;
      if (!el || reducedMotion()) return;
      const box = el.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width - 0.5;
      const y = (e.clientY - box.top) / box.height - 0.5;
      el.style.setProperty('--ry', `${(x * maxDegrees * 2).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-y * maxDegrees * 2).toFixed(2)}deg`);
    },
    onMouseLeave: () => {
      ref.current?.style.setProperty('--rx', '0deg');
      ref.current?.style.setProperty('--ry', '0deg');
    },
  };
}

export function useLandingPageClass() {
  useEffect(() => {
    document.documentElement.classList.add('landing-page');
    return () => document.documentElement.classList.remove('landing-page');
  }, []);
}

/** Sets the browser tab title and the search description in the visitor's language, and puts them back on leaving. */
export function useLandingMeta() {
  const { copy } = useLanding();
  useEffect(() => {
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const before = { title: document.title, description: description?.content ?? '' };
    document.title = copy.meta.title;
    if (description) description.content = copy.meta.description;
    return () => {
      document.title = before.title;
      if (description) description.content = before.description;
    };
  }, [copy]);
}
