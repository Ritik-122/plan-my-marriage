import {
  LandingInteractions,
  LandingHeader,
  LandingFooter,
} from "@/components/landing/interactions";
import { Hero } from "@/components/landing/hero";
import { Ceremonies } from "@/components/landing/ceremonies";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Family } from "@/components/landing/family";
import { Features } from "@/components/landing/features";
import { CeremonyPreview } from "@/components/landing/ceremony-preview";
import { GuestExperience } from "@/components/landing/guest-experience";
import { Themes } from "@/components/landing/themes";
import { Memories } from "@/components/landing/memories";
import { Vendors } from "@/components/landing/vendors";
import { FinalCallToAction } from "@/components/landing/final-call-to-action";
export default function HomePage() {
  return (
    <LandingInteractions>
      <LandingHeader />
      <main id="main-content" className="w-full pt-20">
        <Hero />
        <Ceremonies />
        <HowItWorks />
        <Family />
        <Features />
        <CeremonyPreview />
        <GuestExperience />
        <Themes />
        <Memories />
        <Vendors />
        <FinalCallToAction />
      </main>
      <LandingFooter />
    </LandingInteractions>
  );
}
