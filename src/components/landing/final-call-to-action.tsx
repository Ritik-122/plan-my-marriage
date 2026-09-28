import { ComingSoonButton } from "./interactions";

export function FinalCallToAction() {
  return (
    <section className="w-full py-24 bg-surface" id="start-planning">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="relative w-full rounded-3xl bg-inverse-surface text-inverse-on-surface p-10 md:p-16 lg:p-20 overflow-hidden shadow-xl">
          <div className="absolute -right-20 -bottom-20 w-96 h-96 border border-white/5 rounded-full pointer-events-none"></div>
          <div className="absolute -right-8 -bottom-8 w-64 h-64 border border-white/5 rounded-full pointer-events-none"></div>
          <div className="max-w-2xl relative z-10">
            <span className="inline-block font-label-sm text-label-sm uppercase tracking-wider text-secondary-container mb-4 font-bold">
              Peace of Mind on Your Nuptials
            </span>
            <h2 className="font-display-sm text-display-sm-mobile md:text-display-sm text-white mb-6 leading-tight">
              You have enough to plan. Your planning app shouldn&rsquo;t add to
              it.
            </h2>
            <p className="font-body-lg text-body-lg text-inverse-on-surface/80 mb-8 leading-relaxed">
              Bring your events, family, guests, expenses, and memories together
              into one calm, architectural workspace.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <ComingSoonButton className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-secondary-container text-on-secondary-container font-label-lg text-label-lg shadow-md hover:bg-white hover:text-primary transition-all font-bold">
                Start Planning — Free
              </ComingSoonButton>
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-white/10 text-white font-label-lg text-label-lg hover:bg-white/20 transition-all"
                href="#workspace-preview"
              >
                Explore Demo Workspace
              </a>
            </div>
            <p className="font-body-sm text-body-sm text-white/50">
              Built for Indian weddings · Product preview · More features coming
              soon
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
