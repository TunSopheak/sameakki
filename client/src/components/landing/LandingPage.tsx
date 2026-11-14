import React from 'react';
import { useLandingSettings } from '../../lib/landingSettings';
import { CreatorCard } from './CreatorCard';
import { FaqSection } from './FaqSection';
import { FeaturesSection } from './FeaturesSection';
import { FinalCta } from './FinalCta';
import { Hero } from './Hero';
import { useLanding, useLandingMeta, useLandingPageClass } from './hooks';
import { LandingHeader } from './LandingHeader';
import { PlansSection } from './PlansSection';
import { ProblemsSection } from './ProblemsSection';
import { SponsorSection } from './SponsorSection';
import { StepsSection } from './StepsSection';
import { APP_NAME } from '../../lib/brand';

/** The page shown before login. */
export const LandingPage: React.FC = () => {
  useLandingPageClass();
  useLandingMeta();
  const { copy } = useLanding();
  const { settings, ready } = useLandingSettings();

  return (
    <div className="min-h-screen overflow-x-clip text-black">
      <LandingHeader />

      <main className="mx-auto max-w-5xl space-y-24 px-4 pb-20 sm:space-y-32 sm:px-6">
        <Hero />
        <ProblemsSection />
        <StepsSection />
        <FeaturesSection />
        <PlansSection settings={settings} ready={ready} />
        <SponsorSection settings={settings} ready={ready} />
        <FaqSection />
        <FinalCta />
      </main>

      <footer className="space-y-6 px-4 pb-10 text-center text-xs text-neutral-500">
        <CreatorCard />
        <p>© {new Date().getFullYear()} {APP_NAME} · {copy.footer.rights}</p>
      </footer>
    </div>
  );
};
