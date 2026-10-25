"use client";
import { useState } from "react";
export function GalleryImage({
  url,
  name,
  className,
}: {
  url: string;
  name: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span className="flex min-h-48 items-center justify-center bg-surface-container-low p-6 text-center text-on-surface-variant">
        Photo unavailable. Refresh the gallery to try again.
      </span>
    );
  // R2 serves original images through the configured CDN; no optimizer proxy or public Next image allowlist is needed.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
