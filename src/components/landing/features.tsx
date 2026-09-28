export function Features() {
  return (
    <section className="w-full py-24 bg-surface" id="features">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-2 block">
            The Architecture
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
            Everything you need to plan. One place.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            A synchronized suite of wedding modules engineered for zero
            confusion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-4">
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                event_note
              </span>
            </div>
            <h3 className="font-title-lg text-title-lg text-primary mb-2">
              Ceremony Schedules
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Separate timelines, venues, and timings for every ritual without
              mixing logistics.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary mb-4">
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                checklist
              </span>
            </div>
            <h3 className="font-title-lg text-title-lg text-primary mb-2">
              Family Task Delegation
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Assign tasks to family members with clear owners, due dates, and
              progress.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary-container mb-4">
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                account_balance_wallet
              </span>
            </div>
            <h3 className="font-title-lg text-title-lg text-primary mb-2">
              Simple Expense Tracking
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Record wedding expenses, payment details, and who paid what in one
              place.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary mb-4">
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                diversity_1
              </span>
            </div>
            <h3 className="font-title-lg text-title-lg text-primary mb-2">
              Guest Groups &amp; RSVP
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Organize guests into named groups and track their RSVP for each
              invited event.
            </p>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-headline-md text-headline-md text-primary">
                Consolidated Expense Ledger
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Illustrative expenses grouped for this preview
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-label-md text-label-md text-primary bg-primary-fixed/30 px-3 py-1 rounded-full">
                Sample expense totals
              </span>
              <span className="font-label-md text-label-md text-tertiary-container bg-tertiary-fixed-dim/30 px-3 py-1 rounded-full">
                Recorded: ₹8,45,000
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-title-md text-title-md text-on-surface">
                  Venue &amp; Food
                </span>
                <span className="font-label-sm text-label-sm text-outline">
                  ₹4,80,000
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mb-2">
                <div
                  className="bg-primary-container h-full rounded-full"
                  style={{ width: "57%" }}
                ></div>
              </div>
              <span className="font-body-sm text-body-sm text-outline">
                57% of recorded expenses
              </span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-title-md text-title-md text-on-surface">
                  Decor &amp; Floral
                </span>
                <span className="font-label-sm text-label-sm text-outline">
                  ₹1,90,000
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mb-2">
                <div
                  className="bg-secondary h-full rounded-full"
                  style={{ width: "22%" }}
                ></div>
              </div>
              <span className="font-body-sm text-body-sm text-outline">
                22% of recorded expenses
              </span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-title-md text-title-md text-on-surface">
                  Photography
                </span>
                <span className="font-label-sm text-label-sm text-outline">
                  ₹1,15,000
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mb-2">
                <div
                  className="bg-tertiary-container h-full rounded-full"
                  style={{ width: "14%" }}
                ></div>
              </div>
              <span className="font-body-sm text-body-sm text-outline">
                14% of recorded expenses
              </span>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-title-md text-title-md text-on-surface">
                  Attire &amp; Styling
                </span>
                <span className="font-label-sm text-label-sm text-outline">
                  ₹60,000
                </span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-1.5 mb-2">
                <div
                  className="bg-secondary-container h-full rounded-full"
                  style={{ width: "7%" }}
                ></div>
              </div>
              <span className="font-body-sm text-body-sm text-outline">
                7% of recorded expenses
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
