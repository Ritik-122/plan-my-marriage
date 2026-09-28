export function HowItWorks() {
  return (
    <section className="w-full py-24 bg-surface" id="how-it-works">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-2 block">
            Orderly Simplicity
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
            Planning your wedding shouldn&rsquo;t feel complicated.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Three straightforward steps to replace endless chats with calm
            clarity.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center font-headline-md text-headline-md text-primary mb-6">
                01
              </div>
              <h3 className="font-title-lg text-title-lg text-primary mb-3">
                Create your wedding
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Add your multi-day dates, venues, ceremony schedules, and custom
                rituals in minutes. Pick from curated Indian wedding structures
                or build your own.
              </p>
            </div>
            <div className="mt-8 pt-6 bg-surface-container-low/50 p-4 rounded-xl">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block mb-1">
                Instant Setup
              </span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">
                Add familiar ceremonies or create your own
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center font-headline-md text-headline-md text-secondary mb-6">
                02
              </div>
              <h3 className="font-title-lg text-title-lg text-primary mb-3">
                Bring your family in
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Invite parents, siblings, cousins, and friends. Admins manage
                the team while Managers help organize ceremonies, guests, tasks,
                and expenses.
              </p>
            </div>
            <div className="mt-8 pt-6 bg-surface-container-low/50 p-4 rounded-xl">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block mb-1">
                No Confusion
              </span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">
                Clear ownership tags for every family volunteer
              </span>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center font-headline-md text-headline-md text-tertiary-container mb-6">
                03
              </div>
              <h3 className="font-title-lg text-title-lg text-primary mb-3">
                Plan everything together
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Track RSVPs per event, assign tasks, record expenses, share
                invitations, and collect guest memories in one shared workspace.
              </p>
            </div>
            <div className="mt-8 pt-6 bg-surface-container-low/50 p-4 rounded-xl">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider block mb-1">
                One shared workspace
              </span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">
                Made for planning on mobile and desktop
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
