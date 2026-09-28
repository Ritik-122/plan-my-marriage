import { ComingSoonButton } from "./interactions";

export function Vendors() {
  return (
    <section className="w-full py-24 bg-surface-container-low" id="vendors">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-2 block">
            Vendor Discovery
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
            Find what your wedding still needs.
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Explore vendor listings and connect directly. These fictional sample
            profiles show how discovery could look.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-surface-container-lowest p-3 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-3 mb-12">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl w-full">
            <span
              className="material-symbols-outlined text-outline text-[20px]"
              aria-hidden="true"
            >
              location_on
            </span>
            <span className="font-body-md text-body-md text-on-surface">
              Delhi NCR · Gurugram
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-surface-container-low rounded-xl w-full">
            <span
              className="material-symbols-outlined text-outline text-[20px]"
              aria-hidden="true"
            >
              photo_camera
            </span>
            <span className="font-body-md text-body-md text-on-surface">
              Wedding Photography &amp; Film
            </span>
          </div>
          <ComingSoonButton className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary-container transition-all">
            Search
          </ComingSoonButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-tertiary-fixed-dim/30 text-tertiary font-label-sm text-label-sm font-bold inline-block mb-1">
                  Sample Vendor
                </span>
                <h3 className="font-title-lg text-title-lg text-primary">
                  Aura Studios
                </h3>
                <p className="font-body-sm text-body-sm text-outline">
                  Editorial &amp; Documentary Wedding Film
                </p>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md font-bold">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  star
                </span>
                Sample
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Wedding photography and films, from candid ceremonies to evening
              celebrations. Illustrative listing.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-surface-container">
              <span className="font-label-sm text-label-sm text-outline">
                Photography · Delhi NCR
              </span>
              <ComingSoonButton className="px-3.5 py-1.5 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md hover:bg-surface-container transition-colors">
                Contact via WhatsApp
              </ComingSoonButton>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-tertiary-fixed-dim/30 text-tertiary font-label-sm text-label-sm font-bold inline-block mb-1">
                  Sample Vendor
                </span>
                <h3 className="font-title-lg text-title-lg text-primary">
                  Veda Scenography
                </h3>
                <p className="font-body-sm text-body-sm text-outline">
                  Architectural Decor &amp; Floral Design
                </p>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md font-bold">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  star
                </span>
                Sample
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Restrained heritage aesthetics using brass installations, muted
              earthy tones, tuberoses, and sustainable Indian textiles.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-surface-container">
              <span className="font-label-sm text-label-sm text-outline">
                Decor · Delhi NCR
              </span>
              <ComingSoonButton className="px-3.5 py-1.5 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md hover:bg-surface-container transition-colors">
                Contact via WhatsApp
              </ComingSoonButton>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded bg-tertiary-fixed-dim/30 text-tertiary font-label-sm text-label-sm font-bold inline-block mb-1">
                  Sample Vendor
                </span>
                <h3 className="font-title-lg text-title-lg text-primary">
                  Rasoi Heritage
                </h3>
                <p className="font-body-sm text-body-sm text-outline">
                  Artisanal Catering &amp; Live Stations
                </p>
              </div>
              <div className="flex items-center gap-1 text-secondary font-label-md text-label-md font-bold">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  star
                </span>
                Sample
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
              Regional menus, live food stations, and sit-down dining for
              wedding celebrations. Illustrative listing.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-surface-container">
              <span className="font-label-sm text-label-sm text-outline">
                Catering · Delhi NCR
              </span>
              <ComingSoonButton className="px-3.5 py-1.5 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md hover:bg-surface-container transition-colors">
                Contact via WhatsApp
              </ComingSoonButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
