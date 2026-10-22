import { Brand } from "@/components/brand";
export default function WebsiteNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface p-6">
      <div className="max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="flex justify-center">
          <Brand />
        </div>
        <h1 className="mt-8 font-headline-md text-3xl text-primary">
          This website is unavailable
        </h1>
        <p className="mt-4 text-on-surface-variant">
          Please check the link or contact the couple. If you received a
          personalized invitation, you can still use that link to view your
          invitation and RSVP.
        </p>
      </div>
    </main>
  );
}
