import { ComingSoonButton } from "./interactions";

export function Themes() {
  return (
    <section className="w-full py-24 bg-surface-container-low" id="themes">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-2 block">
            Bespoke Styling
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
            Your wedding, your style.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Three refined aesthetic directions for your guest-facing website and
            invitations, free from generic templates.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-full h-44 rounded-xl bg-surface-container-high mb-6 overflow-hidden flex items-center justify-center relative p-6">
                <div className="w-28 h-36 border-2 border-secondary/40 rounded-t-full flex items-center justify-center bg-surface-container-low/60">
                  <span className="font-headline-md text-headline-md text-secondary">
                    Classic
                  </span>
                </div>
              </div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold block mb-1">
                Theme 01
              </span>
              <h3 className="font-title-lg text-title-lg text-primary mb-2">
                Classic Indian
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Sophisticated arch geometry, warm terracotta, tactile sand paper
                textures, and poised editorial serif typography.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">
                Tone: Warm &amp; Timeless
              </span>
              <ComingSoonButton
                className="font-label-sm text-label-sm text-primary font-bold cursor-pointer"
                aria-label="Preview invitation theme"
              >
                Preview →
              </ComingSoonButton>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-full h-44 rounded-xl bg-surface-container-high mb-6 overflow-hidden flex items-center justify-center relative p-6">
                <div className="w-32 h-28 bg-surface-container-lowest p-3 shadow-sm rounded-md flex flex-col justify-between">
                  <div className="w-12 h-2 bg-primary rounded-full"></div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-outline-variant rounded-full"></div>
                    <div className="w-3/4 h-1.5 bg-outline-variant rounded-full"></div>
                  </div>
                  <div className="w-6 h-2 bg-secondary rounded-full"></div>
                </div>
              </div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold block mb-1">
                Theme 02
              </span>
              <h3 className="font-title-lg text-title-lg text-primary mb-2">
                Modern Minimal
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Expansive negative space, sharp monochrome layout, quiet
                typography, and architectural Swiss-style clarity.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">
                Tone: Contemporary Precision
              </span>
              <ComingSoonButton
                className="font-label-sm text-label-sm text-primary font-bold cursor-pointer"
                aria-label="Preview invitation theme"
              >
                Preview →
              </ComingSoonButton>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-full h-44 rounded-xl bg-primary-container mb-6 overflow-hidden flex items-center justify-center relative p-6">
                <div className="w-32 h-28 border border-primary-fixed/30 rounded-lg flex flex-col items-center justify-center p-3 text-center">
                  <span className="font-headline-md text-headline-md text-primary-fixed">
                    Royal
                  </span>
                  <span className="font-label-sm text-label-sm text-primary-fixed-dim">
                    Dignified Reserve
                  </span>
                </div>
              </div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold block mb-1">
                Theme 03
              </span>
              <h3 className="font-title-lg text-title-lg text-primary mb-2">
                Royal Indian
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Deep muted aubergine, refined hairline frames, warm champagne
                borders, and stately ceremonial hierarchy.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-surface-container flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">
                Tone: Regal &amp; Understated
              </span>
              <ComingSoonButton
                className="font-label-sm text-label-sm text-primary font-bold cursor-pointer"
                aria-label="Preview invitation theme"
              >
                Preview →
              </ComingSoonButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
