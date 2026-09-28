import Image from "next/image";

export function Memories() {
  return (
    <section className="w-full py-24 bg-surface" id="memories">
      <div className="max-w-[1440px] mx-auto px-margin">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-3 block">
              Collaborative Memory Vault
            </span>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">
              Every guest sees the wedding differently.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-8">
              Create an event-specific QR code for your dinner tables and decor
              corners. Guests scan with their phone camera to instantly upload
              their favorite candid snaps – no account needed.
            </p>

            <div className="p-6 rounded-2xl bg-surface-container-low shadow-sm flex flex-wrap items-center gap-6">
              <div className="w-24 h-24 bg-surface-container-lowest rounded-xl p-2 shadow-inner flex items-center justify-center shrink-0">
                <svg
                  className="w-full h-full text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h4v4h-4v-4zm-4-4h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm2 2h2v2h-2v-2z" />
                </svg>
              </div>
              <div>
                <span className="font-title-md text-title-md text-primary font-bold block mb-1">
                  Photo Upload QR Preview
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Sample illustration · Not a scannable code
                </p>
                <span className="font-label-sm text-label-sm text-secondary font-bold mt-2 inline-block">
                  Illustrative gallery · Sample photos
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm space-y-2">
                <div className="w-full h-40 rounded-lg bg-surface-container-high overflow-hidden flex items-center justify-center">
                  <Image
                    className="w-full h-full object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    src="/landing/sangeet.png"
                    width="640"
                    height="800"
                    alt="Sample wedding memory"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-outline">
                    Sangeet · 8:42 PM
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-medium">
                    By Rohan K.
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm space-y-2">
                <div className="w-full h-40 rounded-lg bg-surface-container-high overflow-hidden flex items-center justify-center">
                  <Image
                    className="w-full h-full object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    src="/landing/mehendi.png"
                    width="640"
                    height="800"
                    alt="Sample wedding memory"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-outline">
                    Mehendi · 4:15 PM
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-medium">
                    By Ananya S.
                  </span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl shadow-sm space-y-2 col-span-2 sm:col-span-1">
                <div className="w-full h-40 rounded-lg bg-surface-container-high overflow-hidden flex items-center justify-center">
                  <Image
                    className="w-full h-full object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    src="/landing/reception.png"
                    width="640"
                    height="800"
                    alt="Sample wedding memory"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-outline">
                    Reception · 9:30 PM
                  </span>
                  <span className="font-label-sm text-label-sm text-primary font-medium">
                    By Vikram D.
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
