export const expenseCard = "rounded-xl bg-white p-5 shadow-sm sm:p-7";
export const expenseField =
  "mt-2 block w-full min-w-0 rounded-lg border border-outline-variant/40 bg-surface-container-low p-3 text-body-md";
export const expenseSecondary =
  "rounded-lg border border-outline-variant px-4 py-3 text-label-lg disabled:opacity-50";
export function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
export function calendarDate(value: string) {
  return new Date(Date.parse(value) + 330 * 60000).toISOString().slice(0, 10);
}
export function expenseDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
export async function expenseApi(url: string, init?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new Error(
      body?.error?.message ??
        "Could not complete this request. Please try again.",
    );
  return body;
}
