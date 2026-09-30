"use client";
import Link from "next/link";
import { SignOutButton } from "./sign-out-button";
export function AccountError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-headline-lg text-headline-lg text-primary">
        We couldn’t open your account.
      </h1>
      <p className="my-5 text-body-lg">
        The account service is temporarily unavailable. Please try again
        shortly.
      </p>
      <div className="flex flex-wrap gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-4 py-2 text-white"
        >
          Try again
        </button>
        <SignOutButton />
      </div>
      <Link href="/" className="mt-8 inline-block underline">
        Back to homepage
      </Link>
    </main>
  );
}
