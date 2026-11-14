import React, { type CSSProperties, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useInView } from './hooks';
import './landing.css';

export const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

interface RevealProps {
  children: ReactNode;
  delay?: number;
  kind?: 'rise' | 'pop';
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, kind = 'rise', className = '' }) => {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} data-in={inView} className={`${kind === 'pop' ? 'lp-pop' : 'lp-reveal'} ${className}`} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
};

export const Section: React.FC<{ id?: string; className?: string; children: ReactNode }> = ({ id, className = '', children }) => (
  <section id={id} className={`scroll-mt-24 ${className}`}>
    {children}
  </section>
);

export const SectionTitle: React.FC<{ children: ReactNode; subtitle?: string }> = ({ children, subtitle }) => (
  <Reveal className="mx-auto max-w-2xl text-center">
    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{children}</h2>
    {subtitle && <p className="mt-3 text-sm leading-relaxed text-neutral-600">{subtitle}</p>}
  </Reveal>
);

type Variant = 'primary' | 'secondary' | 'onBrand' | 'onBrandOutline';

const BUTTON_BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]';

// onBrand uses fixed colours: the "white" token turns dark in dark mode
const BUTTON_VARIANTS: Record<Variant, string> = {
  primary: 'lp-shine relative overflow-hidden bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark hover:shadow-xl hover:shadow-brand/30',
  secondary: 'border border-neutral-200 bg-white text-black hover:bg-neutral-100 hover:shadow-md',
  onBrand: 'lp-shine relative overflow-hidden bg-[#ffffff] font-bold text-[#840015] shadow-lg hover:shadow-2xl',
  onBrandOutline: 'border-2 border-[#ffffff99] font-bold text-[#ffffff] hover:bg-[#ffffff1f]',
};

interface ButtonProps {
  variant?: Variant;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', icon: Icon, href, onClick, fullWidth, children }) => {
  const className = `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${fullWidth ? 'w-full' : 'w-full sm:w-auto'}`;
  const content = (
    <>
      {Icon && <Icon className="size-4" />}
      {children}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
};
