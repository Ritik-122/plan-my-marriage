import { ComingSoonButton } from "./interactions";

export function GuestExperience() {
  return (
    <section className="w-full py-24 bg-surface" id="guest-experience">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary font-label-md text-label-md uppercase tracking-wider mb-4">
              Zero Friction
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">
              Beautiful for guests. Simple for you.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 leading-relaxed">
              Guests open their private invitation link to see their invited
              events, respond, and find the venue. A separate photo-upload QR
              lets them contribute memories without an account.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm">
                  1
                </span>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  Bespoke Wedding Website &amp; Digital Invitation
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-label-sm text-label-sm">
                  2
                </span>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  Granular Event Details, Dress Codes &amp; Google Maps Gate Pin
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                <span className="w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center font-label-sm text-label-sm">
                  3
                </span>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  Simple RSVP for Each Invited Event
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm">
                <span className="w-6 h-6 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-label-sm text-label-sm">
                  4
                </span>
                <span className="font-body-md text-body-md text-on-surface font-medium">
                  Photo Upload QR &amp; Links for Relatives Joining Remotely
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-container-high/60">
              <span className="font-label-md text-label-md text-primary font-bold block mb-1">
                ✨ No app install or login required for guests
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Works instantly across iOS Safari, Android Chrome, and WhatsApp
                web views.
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-[340px] bg-surface-container-lowest rounded-[36px] shadow-2xl p-4 ring-8 ring-surface-container-highest">
              <div className="flex justify-between items-center px-4 py-2 mb-4">
                <span className="font-label-sm text-label-sm font-bold text-on-surface">
                  9:41
                </span>
                <div className="w-16 h-3 bg-surface-container-highest rounded-full"></div>
                <span
                  className="material-symbols-outlined text-[16px] text-on-surface"
                  aria-hidden="true"
                >
                  wifi
                </span>
              </div>

              <div className="space-y-4">
                <div className="text-center py-4 bg-surface-container-low rounded-2xl">
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest block mb-1">
                    Wedding Invitation
                  </span>
                  <h4 className="font-headline-md text-headline-md text-primary">
                    Ritik &amp; Priya
                  </h4>
                  <p className="font-body-sm text-body-sm text-outline">
                    November 20 – 23, 2027
                  </p>
                  <div className="mt-3 inline-block px-3 py-1 bg-surface-container-lowest rounded-full shadow-sm font-label-sm text-label-sm text-primary">
                    Welcome, Rajesh Sharma
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-title-md text-title-md text-on-surface font-bold block">
                        Sangeet Night
                      </span>
                      <span className="font-body-sm text-body-sm text-outline">
                        The Roseate Ballroom · 7:00 PM
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed-dim/30 text-tertiary font-label-sm text-label-sm">
                      Attending
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <ComingSoonButton className="flex-1 py-1.5 rounded-lg bg-surface-container-high text-primary font-label-sm text-label-sm flex items-center justify-center gap-1">
                      <span
                        className="material-symbols-outlined text-[14px]"
                        aria-hidden="true"
                      >
                        map
                      </span>{" "}
                      Google Maps
                    </ComingSoonButton>
                    <ComingSoonButton className="flex-1 py-1.5 rounded-lg bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm flex items-center justify-center gap-1">
                      <span
                        className="material-symbols-outlined text-[14px]"
                        aria-hidden="true"
                      >
                        edit
                      </span>{" "}
                      RSVP
                    </ComingSoonButton>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-primary-container text-on-primary text-center">
                  <p className="font-title-md text-title-md text-on-primary">
                    Snap a candid moment?
                  </p>
                  <p className="font-body-sm text-body-sm text-primary-fixed-dim mb-2">
                    Add your photos straight to the couple&rsquo;s album
                  </p>
                  <ComingSoonButton className="px-4 py-1.5 rounded-full bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold shadow-sm">
                    Upload Photo
                  </ComingSoonButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
