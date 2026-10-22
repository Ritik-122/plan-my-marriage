"use client";
export default function WebsiteError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-6">
      <div className="max-w-lg rounded-xl bg-white p-8 text-center">
        <h1 className="font-headline-md text-3xl text-primary">
          We couldn’t load this website
        </h1>
        <p className="mt-4">Please try again in a moment.</p>
        <button
          className="mt-6 rounded-lg bg-primary-container px-5 py-3 text-white"
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
