import React from 'react';
import { Compass, Send } from 'lucide-react';
import { useLanding } from './hooks';
import { Button } from './ui';

interface CtaButtonsProps {
  /** On the brand-coloured block, which needs light buttons. */
  onBrand?: boolean;
  align?: 'center' | 'start';
}

/** "Try it now" and "Contact on Telegram": the two things we want visitors to do. */
export const CtaButtons: React.FC<CtaButtonsProps> = ({ onBrand = false, align = 'center' }) => {
  const { copy, enterDemo, contactHref } = useLanding();
  return (
    <div className={`flex flex-col items-center gap-3 sm:flex-row ${align === 'center' ? 'sm:justify-center' : 'sm:justify-center lg:justify-start'}`}>
      <Button variant={onBrand ? 'onBrand' : 'primary'} icon={Compass} onClick={enterDemo}>
        {copy.hero.explore}
      </Button>
      <Button variant={onBrand ? 'onBrandOutline' : 'secondary'} icon={Send} href={contactHref}>
        {copy.hero.contact}
      </Button>
    </div>
  );
};
