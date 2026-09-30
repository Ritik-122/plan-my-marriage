import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden pt-12 pb-24 lg:pt-16 lg:pb-32"
      id="home"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] bg-linear-to-b from-secondary-container/15 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container border-0 shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-label-md text-label-md text-secondary tracking-wide uppercase">
              Designed for the multi-event reality of Indian weddings
            </span>
          </div>
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight mb-6 max-w-3xl">
            Plan the wedding. Together.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed">
            One calm place to manage every event, guest, task, expense,
            invitation, and memory of your Indian wedding without the chaos of
            scattered spreadsheets.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md hover:bg-primary transition-all"
            >
              Start Planning — Free
            </Link>
            <a
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-surface-container-lowest text-on-surface font-label-lg text-label-lg shadow-sm hover:bg-surface-container transition-all"
              href="#how-it-works"
            >
              <span
                className="material-symbols-outlined text-[20px] text-secondary"
                aria-hidden="true"
              >
                play_circle
              </span>
              See How It Works
            </a>
          </div>
          <p className="font-body-sm text-body-sm text-outline">
            Product preview · Built for Indian weddings · Sample data below
          </p>
        </div>

        <div
          className="relative w-full max-w-6xl mx-auto"
          id="workspace-preview"
        >
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-surface-container-high px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-outline-variant inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-outline-variant inline-block"></span>
                  <span className="w-3 h-3 rounded-full bg-outline-variant inline-block"></span>
                </div>
                <div className="h-4 w-px bg-outline-variant mx-1"></div>
                <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-md shadow-sm">
                  <span
                    className="material-symbols-outlined text-primary text-[18px]"
                    aria-hidden="true"
                  >
                    favorite
                  </span>
                  <span className="font-title-md text-title-md text-on-surface">
                    Ritik &amp; Priya&rsquo;s Wedding
                  </span>
                  <span
                    className="material-symbols-outlined text-outline text-[16px]"
                    aria-hidden="true"
                  >
                    expand_more
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider font-bold">
                  Sample workspace
                </span>

                <div className="flex items-center -space-x-2 pl-2">
                  <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm ring-2 ring-surface-container-lowest">
                    P
                  </div>
                  <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm ring-2 ring-surface-container-lowest">
                    R
                  </div>
                  <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center font-label-sm text-label-sm ring-2 ring-surface-container-lowest">
                    M
                  </div>
                  <div className="w-7 h-7 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm ring-2 ring-surface-container-lowest">
                    +1
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-surface-container">
              <div className="bg-surface-container-lowest p-5 flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Tasks Status
                </span>
                <div className="mt-2">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="font-headline-md text-headline-md text-primary">
                      18 / 24
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary font-bold">
                      75% done
                    </span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-tertiary-container h-full rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Total Guests
                </span>
                <div className="mt-2">
                  <span className="font-headline-md text-headline-md text-primary">
                    287
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant block">
                    Unique guest records
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Expenses Recorded
                </span>
                <div className="mt-2">
                  <span className="font-headline-md text-headline-md text-primary">
                    ₹8,45,000
                  </span>
                  <span className="font-body-sm text-body-sm text-outline block">
                    Total recorded expenses
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 flex flex-col justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Next Ceremony
                </span>
                <div className="mt-2">
                  <span className="font-headline-md text-headline-md text-secondary">
                    Mehendi
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant block">
                    Nov 20, 2027
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 p-6 gap-6 bg-surface-container-low">
              <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-title-lg text-title-lg text-primary">
                    Ceremonies Timeline
                  </h3>
                  <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/20 px-2 py-0.5 rounded">
                    6 Events
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                      <div>
                        <p className="font-title-md text-title-md text-on-surface">
                          Mehendi Ceremony
                        </p>
                        <p className="font-body-sm text-body-sm text-outline">
                          Nov 20 · The Roseate Lawn
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-md text-label-md text-primary bg-primary-fixed/30 px-2 py-0.5 rounded">
                        85 Guests
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary-container/10 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                      <div>
                        <p className="font-title-md text-title-md text-primary font-bold">
                          Sangeet Night
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          Nov 21 · Grand Ballroom
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-md text-label-md text-primary bg-primary-fixed/40 px-2 py-0.5 rounded">
                        180 Guests
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
                      <div>
                        <p className="font-title-md text-title-md text-on-surface">
                          Pheras &amp; Wedding
                        </p>
                        <p className="font-body-sm text-body-sm text-outline">
                          Nov 22 · Heritage Mandap
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-md text-label-md text-primary bg-primary-fixed/30 px-2 py-0.5 rounded">
                        250 Guests
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
                      <div>
                        <p className="font-title-md text-title-md text-on-surface">
                          Grand Reception
                        </p>
                        <p className="font-body-sm text-body-sm text-outline">
                          Nov 23 · Oberoi Banquet
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-md text-label-md text-primary bg-primary-fixed/30 px-2 py-0.5 rounded">
                        270 Guests
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-title-lg text-title-lg text-primary">
                        Family Checklist
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline">
                      Sorted by Priority
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/60 group">
                      <div className="flex items-center gap-3">
                        <span
                          className="material-symbols-outlined text-tertiary-container text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                          aria-hidden="true"
                        >
                          check_circle
                        </span>
                        <div>
                          <p className="font-body-md text-body-md text-outline line-through">
                            Confirm Sangeet DJ sound rider &amp; stage setup
                          </p>
                          <span className="font-label-sm text-label-sm text-outline">
                            Assigned to Rahul · Sangeet
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-tertiary-container bg-tertiary-fixed-dim/30 px-2 py-0.5 rounded">
                        Done
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low/60 group">
                      <div className="flex items-center gap-3">
                        <span
                          className="material-symbols-outlined text-tertiary-container text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                          aria-hidden="true"
                        >
                          check_circle
                        </span>
                        <div>
                          <p className="font-body-md text-body-md text-outline line-through">
                            Confirm photographer arrival time
                          </p>
                          <span className="font-label-sm text-label-sm text-outline">
                            Assigned to Priya · All Ceremonies
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-tertiary-container bg-tertiary-fixed-dim/30 px-2 py-0.5 rounded">
                        Done
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <span
                          className="material-symbols-outlined text-outline text-[20px]"
                          aria-hidden="true"
                        >
                          radio_button_unchecked
                        </span>
                        <div>
                          <p className="font-body-md text-body-md text-on-surface font-medium">
                            Send personalized digital invites to maternal
                            relatives
                          </p>
                          <span className="font-label-sm text-label-sm text-secondary">
                            Assigned to Mom · Wedding
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-secondary-container bg-secondary-container/20 px-2 py-0.5 rounded">
                        In Progress
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <span
                          className="material-symbols-outlined text-outline text-[20px]"
                          aria-hidden="true"
                        >
                          radio_button_unchecked
                        </span>
                        <div>
                          <p className="font-body-md text-body-md text-on-surface font-medium">
                            Catering tasting session at The Grand Ballroom
                          </p>
                          <span className="font-label-sm text-label-sm text-primary">
                            Assigned to Ritik · Due Tomorrow
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm text-error bg-error-container/40 px-2 py-0.5 rounded">
                        High Priority
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between bg-surface-container-low px-3 py-2 rounded-lg">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Illustrative workspace · Sample data
                  </span>
                  <a
                    href="#features"
                    className="font-label-sm text-label-sm text-primary font-bold hover:underline"
                  >
                    Explore features →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
