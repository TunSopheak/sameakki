import React from 'react';
import { useLanding } from './hooks';
import { Button } from './ui';
import { Icons } from '../icons';

interface CtaButtonsProps {
  onBrand?: boolean;
  align?: 'center' | 'start';
}

/** The Try it now and Contact buttons. */
export const CtaButtons: React.FC<CtaButtonsProps> = ({ onBrand = false, align = 'center' }) => {
  const { copy, enterDemo, contactHref, signedIn } = useLanding();
  return (
    <div className={`flex flex-col items-center gap-3 sm:flex-row ${align === 'center' ? 'sm:justify-center' : 'sm:justify-center lg:justify-start'}`}>
      {!signedIn && (
        <Button variant={onBrand ? 'onBrand' : 'primary'} icon={Icons.demo} onClick={enterDemo}>
          {copy.hero.explore}
        </Button>
      )}
      <Button variant={onBrand ? 'onBrandOutline' : 'secondary'} icon={Icons.send} href={contactHref}>
        {copy.hero.contact}
      </Button>
    </div>
  );
};
