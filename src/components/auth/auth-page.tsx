import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthForm } from "./auth-form";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-outline-variant/20">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-margin py-4">
          <Brand />
          <Link
            href="/"
            className="text-label-lg text-on-surface-variant hover:text-primary"
          >
            Back to overview
          </Link>
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-margin py-12 lg:grid-cols-12 lg:py-20">
        <div className="space-y-6 lg:col-span-7">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-label-sm uppercase tracking-wider text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Collaborative wedding planning
          </span>
          <h1 className="max-w-xl font-display-lg text-display-lg-mobile tracking-tight text-primary md:text-display-lg">
            {registering
              ? "Your wedding. Your people. One place."
              : "Welcome back to your wedding plan."}
          </h1>
          <p className="max-w-lg text-body-lg text-on-surface-variant">
            {registering
              ? "Start with an account for you. We’re building a calmer way to bring your celebrations and the people you love together."
              : "A place for the plans you make together, and all the celebrations still to come."}
          </p>
          <div className="relative hidden max-w-md items-center gap-6 overflow-hidden rounded-xl bg-surface-container-low p-6 shadow-sm sm:flex">
            <svg
              aria-hidden="true"
              className="shrink-0 text-primary-container"
              fill="none"
              height="120"
              viewBox="0 0 104 120"
              width="104"
            >
              <path
                d="M8 116 V52 C8 27.6995 27.6995 8 52 8 C76.3005 8 96 27.6995 96 52 V116"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="12"
              />
              <path
                d="M28 116 V64 C28 50.7452 38.7452 40 52 40 C65.2548 40 76 50.7452 76 64 V116"
                stroke="#97472E"
                strokeLinecap="round"
                strokeWidth="10"
              />
              <circle cx="52" cy="74" fill="currentColor" r="6" />
            </svg>
            <div>
              <p className="text-label-sm uppercase tracking-widest text-secondary">
                Made for together
              </p>
              <p className="mt-2 font-headline-md text-headline-md text-primary">
                Every celebration.
                <br />
                One shared beginning.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-center lg:col-span-5">
          <AuthForm mode={mode} />
        </div>
      </main>
      <footer className="bg-surface-container-low px-margin py-6 text-center text-body-sm text-on-surface-variant">
        © {new Date().getFullYear()} Plan My Marriage. Thoughtful planning for
        Indian weddings.
      </footer>
    </div>
  );
}
