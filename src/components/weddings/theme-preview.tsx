import {
  formatWeddingDate,
  themeNames,
  type Theme,
} from "@/modules/weddings/schema";
export function ThemePreview({
  theme,
  brideName,
  groomName,
  date,
  city,
}: {
  theme: Theme;
  brideName: string;
  groomName: string;
  date?: string;
  city: string;
}) {
  const royal = theme === "ROYAL_INDIAN",
    modern = theme === "MODERN_MINIMAL";
  return (
    <div
      aria-label={`${themeNames[theme]} sample preview`}
      className={`flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-lg p-5 text-center ${royal ? "bg-primary text-[#efddba]" : modern ? "bg-[#f6f5f1] text-[#252525]" : "bg-[#faf0e4] text-primary"}`}
    >
      <div
        className={`flex w-full min-w-0 flex-1 flex-col items-center justify-center px-4 py-6 ${royal ? "border border-[#d5b677]/50" : modern ? "border-y border-black/20" : "rounded-t-[100px] border border-secondary/30"}`}
      >
        <p className="mb-5 text-[9px] uppercase tracking-[.2em]">
          {royal
            ? "A celebration of togetherness"
            : modern
              ? "The union of"
              : "Together with their families"}
        </p>
        <p
          className={`w-full break-words text-2xl ${modern ? "font-light tracking-tight" : "font-display-sm"}`}
        >
          {brideName || "Bride"}
          <span className="my-1 block text-lg">{modern ? "+" : "&"}</span>
          {groomName || "Groom"}
        </p>
        <p className="mt-4 break-words text-body-sm">
          {date ? formatWeddingDate(date) : "Your wedding date"}
        </p>
        <p className="mt-1 max-w-full break-words text-body-sm">
          {city || "Your wedding city"}
        </p>
      </div>
      <p className="mt-3 text-[9px] uppercase tracking-widest opacity-70">
        Style preview
      </p>
    </div>
  );
}
