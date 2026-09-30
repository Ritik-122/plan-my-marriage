import Link from "next/link";
export default function WeddingNotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-headline-lg text-headline-lg text-primary">
        Wedding not found
      </h1>
      <p className="mt-4 text-body-lg">
        This wedding isn’t available to your account.
      </p>
      <Link href="/app" className="mt-6 inline-block text-primary underline">
        Back to your weddings
      </Link>
    </main>
  );
}
