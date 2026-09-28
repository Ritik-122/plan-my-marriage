export function CeremonyPreview() {
  return (
    <section
      className="w-full py-24 bg-surface-container-low"
      id="ceremony-preview"
    >
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 mb-12">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-2 block">
              Modular Control
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary">
              One wedding. Many celebrations.
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            A sample ceremony view brings together the schedule, guest
            responses, tasks, and recorded expenses.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <span className="px-5 py-2.5 rounded-full bg-surface-container-lowest font-label-md text-label-md text-outline hover:text-on-surface whitespace-nowrap shadow-sm">
            Roka
          </span>
          <span className="px-5 py-2.5 rounded-full bg-surface-container-lowest font-label-md text-label-md text-outline hover:text-on-surface whitespace-nowrap shadow-sm">
            Haldi
          </span>
          <span className="px-5 py-2.5 rounded-full bg-surface-container-lowest font-label-md text-label-md text-outline hover:text-on-surface whitespace-nowrap shadow-sm">
            Mehendi
          </span>
          <span className="px-5 py-2.5 rounded-full bg-primary font-label-md text-label-md text-on-primary whitespace-nowrap shadow-md">
            Sangeet · Active
          </span>
          <span className="px-5 py-2.5 rounded-full bg-surface-container-lowest font-label-md text-label-md text-outline hover:text-on-surface whitespace-nowrap shadow-sm">
            Wedding Pheras
          </span>
          <span className="px-5 py-2.5 rounded-full bg-surface-container-lowest font-label-md text-label-md text-outline hover:text-on-surface whitespace-nowrap shadow-sm">
            Reception
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-md">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-8 border-b border-surface-container">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-display-sm text-display-sm-mobile md:text-display-sm text-primary">
                  Sangeet Night
                </h3>
                <span className="px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm font-bold">
                  21 Nov 2027
                </span>
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-[20px] text-secondary"
                  aria-hidden="true"
                >
                  location_on
                </span>
                The Roseate Ballroom · 7:00 PM onwards · Dress Code:
                Indo-Western Glamour
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-xl bg-tertiary-fixed-dim/30 text-tertiary font-label-md text-label-md font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
                92% RSVP Confirmation
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Attendance Status
              </span>
              <p className="font-headline-md text-headline-md text-primary">
                180 Guests
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                165 Confirmed · 15 Pending
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Assigned Tasks
              </span>
              <p className="font-headline-md text-headline-md text-primary">
                8 Tasks
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                6 Completed · 2 In Progress
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Ceremony Expense
              </span>
              <p className="font-headline-md text-headline-md text-primary">
                ₹1,45,000
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                DJ, Sound, Lighting &amp; Choreography
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                Shared Live Link
              </span>
              <p className="font-headline-md text-headline-md text-secondary">
                External stream link
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Share a link from your streaming provider
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
