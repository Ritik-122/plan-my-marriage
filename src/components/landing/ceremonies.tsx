export function Ceremonies() {
  return (
    <section className="w-full py-24 bg-surface-container-low" id="ceremonies">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="max-w-3xl mb-12">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-3 block">
            The Nuance of Indian Celebrations
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-6">
            Indian weddings aren&rsquo;t one event.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            Six ceremonies, hundreds of guests, and a whole family helping out.
            Keep schedules, expenses, and responsibilities together instead of
            scattered across chats and spreadsheets.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm text-center flex flex-col items-center justify-center">
            <span className="font-headline-md text-headline-md text-primary mb-1">
              01
            </span>
            <span className="font-title-md text-title-md text-on-surface">
              Roka
            </span>
            <span className="font-body-sm text-body-sm text-outline mt-1">
              Intimate Family
            </span>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm text-center flex flex-col items-center justify-center">
            <span className="font-headline-md text-headline-md text-primary mb-1">
              02
            </span>
            <span className="font-title-md text-title-md text-on-surface">
              Haldi
            </span>
            <span className="font-body-sm text-body-sm text-outline mt-1">
              Daytime Floral
            </span>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm text-center flex flex-col items-center justify-center">
            <span className="font-headline-md text-headline-md text-primary mb-1">
              03
            </span>
            <span className="font-title-md text-title-md text-on-surface">
              Mehendi
            </span>
            <span className="font-body-sm text-body-sm text-outline mt-1">
              Lawn &amp; Chai
            </span>
          </div>
          <div className="p-4 rounded-xl bg-primary-container text-on-primary shadow-md text-center flex flex-col items-center justify-center">
            <span className="font-headline-md text-headline-md text-primary-fixed mb-1">
              04
            </span>
            <span className="font-title-md text-title-md text-on-primary font-bold">
              Sangeet
            </span>
            <span className="font-body-sm text-body-sm text-primary-fixed-dim mt-1">
              High Energy
            </span>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm text-center flex flex-col items-center justify-center">
            <span className="font-headline-md text-headline-md text-primary mb-1">
              05
            </span>
            <span className="font-title-md text-title-md text-on-surface">
              Pheras
            </span>
            <span className="font-body-sm text-body-sm text-outline mt-1">
              Vedic Nuptials
            </span>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm text-center flex flex-col items-center justify-center">
            <span className="font-headline-md text-headline-md text-primary mb-1">
              06
            </span>
            <span className="font-title-md text-title-md text-on-surface">
              Reception
            </span>
            <span className="font-body-sm text-body-sm text-outline mt-1">
              Formal Dinner
            </span>
          </div>
        </div>

        <div className="p-8 lg:p-12 rounded-2xl bg-surface-container-lowest shadow-md flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 text-secondary font-label-md text-label-md uppercase tracking-wider">
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                alt_route
              </span>
              The Architectural Shift
            </div>
            <h3 className="font-headline-md text-headline-md text-primary">
              Bring everything into one tranquil wedding workspace.
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Keep each event’s guests, dress code, venue, tasks, and expenses
              organized within one shared wedding workspace.
            </p>
          </div>
          <a
            className="shrink-0 px-7 py-3.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg shadow-sm hover:bg-primary-container transition-all"
            href="#workspace-preview"
          >
            Explore Workspace Demo
          </a>
        </div>
      </div>
    </section>
  );
}
