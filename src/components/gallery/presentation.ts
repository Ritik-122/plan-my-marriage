export const secondary =
  "rounded-lg border border-outline-variant bg-white px-4 py-3 text-label-lg hover:bg-surface-container-low disabled:opacity-50";
export function fileSize(bytes: number) {
  return bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
export class GalleryError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}
export async function galleryApi<T>(
  url: string,
  options?: RequestInit,
): Promise<{ data: T; meta: { nextCursor?: string | null } }> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  if (response.status === 204) return { data: undefined as T, meta: {} };
  const result = await response.json();
  if (!response.ok)
    throw new GalleryError(
      result.error?.message ?? "Could not complete the photo request.",
      response.status,
      result.error?.code ?? "",
    );
  return result;
}
export const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
