import React from 'react';
import { useLandingSettings } from '../../lib/landingSettings';
import { FaqSection } from './FaqSection';
import { FeaturesSection } from './FeaturesSection';
import { FinalCta } from './FinalCta';
import { Hero } from './Hero';
import { useLanding, useLandingPageClass } from './hooks';
import { LandingHeader } from './LandingHeader';
import { PlansSection } from './PlansSection';
import { ProblemsSection } from './ProblemsSection';
import { SponsorSection } from './SponsorSection';
import { StepsSection } from './StepsSection';

/** The page people see before signing in: what it is, what it costs, and how to start. */
export const LandingPage: React.FC = () => {
  useLandingPageClass();
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

      <footer className="px-4 pb-10 text-center text-xs text-neutral-500">LeaderSync · {copy.footer.rights}</footer>
    </div>
  );
};
