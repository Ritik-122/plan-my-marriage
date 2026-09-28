"use client";

import Image from "next/image";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

const ComingSoonContext = createContext<() => void>(() => {});
const links = [
  ["Features", "features"],
  ["How It Works", "how-it-works"],
  ["Themes", "themes"],
  ["Vendors", "vendors"],
] as const;
const primaryButton =
  "inline-flex items-center justify-center rounded-full bg-primary-container px-5 py-3 text-label-lg font-label-lg text-white hover:bg-primary transition-colors";

export function LandingInteractions({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <ComingSoonContext.Provider value={() => dialog.current?.showModal()}>
      {children}
      <dialog
        ref={dialog}
        aria-labelledby="coming-soon-title"
        aria-describedby="coming-soon-description"
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-surface p-8 text-on-surface shadow-xl"
      >
        <p className="mb-3 text-label-md uppercase tracking-widest text-secondary">
          Plan My Marriage
        </p>
        <h2
          id="coming-soon-title"
          className="font-display-sm text-display-sm text-primary"
        >
          Coming soon
        </h2>
        <p
          id="coming-soon-description"
          className="my-5 text-body-lg text-on-surface-variant"
        >
          We’re building your shared wedding workspace, one feature at a time.
          For now, explore the landing page and its sample previews.
        </p>
        <form method="dialog">
          <button className={primaryButton}>Back to exploring</button>
        </form>
      </dialog>
    </ComingSoonContext.Provider>
  );
}

export function ComingSoonButton({
  children,
  ...props
}: Omit<ComponentProps<"button">, "onClick">) {
  const open = useContext(ComingSoonContext);
  return (
    <button {...props} type="button" onClick={open}>
      {children}
    </button>
  );
}

function Brand() {
  return (
    <a
      href="#home"
      aria-label="Plan My Marriage home"
      className="flex shrink-0 items-center gap-2 text-primary"
    >
      <Image
        src="/landing/logo.svg"
        alt=""
        width={32}
        height={32}
        className="shrink-0"
      />
      <span className="font-headline-md text-lg sm:text-headline-md">
        Plan My Marriage
      </span>
    </a>
  );
}

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/95 shadow-sm backdrop-blur-xl">
      <a
        href="#main-content"
        className="absolute left-4 -top-20 rounded-lg bg-primary p-3 text-white focus:top-2"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-margin">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 lg:flex"
        >
          {links.map(([label, id]) => (
            <a
              className="text-label-lg text-on-surface-variant hover:text-primary"
              key={id}
              href={`#${id}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-4 lg:flex">
          <ComingSoonButton className="px-2 py-3 text-label-lg">
            Sign In
          </ComingSoonButton>
          <ComingSoonButton className={primaryButton}>
            Start Planning — Free
          </ComingSoonButton>
        </div>
        <button
          className="rounded-lg border border-outline-variant px-3 py-2 text-label-lg lg:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>
      {menuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-t border-outline-variant/30 px-6 pb-6 lg:hidden"
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenuOpen(false);
          }}
        >
          {links.map(([label, id]) => (
            <a
              className="block py-3 text-body-md"
              key={id}
              href={`#${id}`}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <ComingSoonButton className="px-2 py-3 text-label-lg">
              Sign In
            </ComingSoonButton>
            <ComingSoonButton className={primaryButton}>
              Start Planning — Free
            </ComingSoonButton>
          </div>
        </nav>
      )}
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-surface-container-low px-margin py-12">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-body-md text-on-surface-variant">
              One calm place for every celebration, every family member, and
              every little detail.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-12 gap-y-4"
          >
            {links.map(([label, id]) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-label-lg hover:text-secondary"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-outline-variant/40 pt-6 text-body-sm text-on-surface-variant">
          <p>© {new Date().getFullYear()} Plan My Marriage</p>
          <p>
            Product preview · All workspace and vendor data is illustrative.
          </p>
        </div>
      </div>
    </footer>
  );
}
