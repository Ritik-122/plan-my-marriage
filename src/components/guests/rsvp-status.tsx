export const rsvpLabels: Record<string, string> = {
  PENDING: "Pending",
  ATTENDING: "Attending",
  NOT_ATTENDING: "Not attending",
};
export function RsvpStatus({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs ${status === "ATTENDING" ? "bg-green-100 text-green-900" : status === "NOT_ATTENDING" ? "bg-stone-100 text-stone-700" : "bg-orange-100 text-orange-900"}`}
    >
      {rsvpLabels[status] ?? "Pending"}
    </span>
  );
}
