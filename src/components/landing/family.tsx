import { ComingSoonButton } from "./interactions";

export function Family() {
  return (
    <section className="w-full py-24 bg-surface-container-low" id="family">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-3 block">
              Family-Centric Workflow
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">
              Planning shouldn&rsquo;t live in one person&rsquo;s WhatsApp.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-8">
              Indian weddings are truly communal productions. Give your parents,
              siblings, and trusted cousins dedicated roles so everyone feels
              empowered, informed, and accountable.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center shrink-0 mt-1">
                  <span
                    className="material-symbols-outlined text-secondary text-[18px]"
                    aria-hidden="true"
                  >
                    verified_user
                  </span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold">
                    Role-Based Family Access
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Admins manage team membership. Managers help with events,
                    guests, tasks, and expenses.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed-dim/40 flex items-center justify-center shrink-0 mt-1">
                  <span
                    className="material-symbols-outlined text-tertiary-container text-[18px]"
                    aria-hidden="true"
                  >
                    history
                  </span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold">
                    Shared Planning Updates
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Keep tasks, guest lists, venue details, and recorded
                    expenses together for the whole planning team.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-md">
            <div className="flex items-center justify-between pb-6 mb-6 bg-surface-container-low p-4 rounded-xl">
              <div>
                <h3 className="font-title-lg text-title-lg text-primary">
                  Core Planning Circle
                </h3>
                <p className="font-body-sm text-body-sm text-outline">
                  4 sample members · Admins and Managers
                </p>
              </div>
              <ComingSoonButton className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md shadow-sm hover:bg-surface-container transition-colors">
                + Invite Family Member
              </ComingSoonButton>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm">
                    P
                  </div>
                  <div>
                    <span className="font-title-md text-title-md text-on-surface block leading-tight">
                      Priya
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">
                      Admin · Bride
                    </span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-label-sm">
                    R
                  </div>
                  <div>
                    <span className="font-title-md text-title-md text-on-surface block leading-tight">
                      Ritik
                    </span>
                    <span className="font-label-sm text-label-sm text-outline">
                      Admin · Groom
                    </span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm">
                    M
                  </div>
                  <div>
                    <span className="font-title-md text-title-md text-on-surface block leading-tight">
                      Mom (Sunita)
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      Manager · Guests &amp; Catering
                    </span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center font-label-sm text-label-sm">
                    R
                  </div>
                  <div>
                    <span className="font-title-md text-title-md text-on-surface block leading-tight">
                      Rahul (Brother)
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary-container">
                      Manager · Sangeet &amp; Logistics
                    </span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
              </div>
            </div>

            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline block mb-4">
                Sample Planning Updates
              </span>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-tertiary-container text-[18px]"
                      aria-hidden="true"
                    >
                      check_circle
                    </span>
                    <span className="font-body-md text-body-md text-on-surface">
                      <strong>Rahul</strong> completed &ldquo;Confirm Sangeet DJ
                      sound rider&rdquo;
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">
                    12m ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-secondary text-[18px]"
                      aria-hidden="true"
                    >
                      group_add
                    </span>
                    <span className="font-body-md text-body-md text-on-surface">
                      <strong>Mom</strong> added 14 guests to Wedding &amp;
                      Reception list
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">
                    1h ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-primary text-[18px]"
                      aria-hidden="true"
                    >
                      edit_location
                    </span>
                    <span className="font-body-md text-body-md text-on-surface">
                      <strong>Priya</strong> updated the Mehendi lawn gate
                      directions
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">
                    3h ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-outline text-[18px]"
                      aria-hidden="true"
                    >
                      payments
                    </span>
                    <span className="font-body-md text-body-md text-on-surface">
                      <strong>Ritik</strong> logged expense: ₹45,000 advance to
                      Photographers
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-outline">
                    Yesterday
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
