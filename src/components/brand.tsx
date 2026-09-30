import Image from "next/image";
import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Plan My Marriage home"
      className="flex shrink-0 items-center gap-2 text-primary"
    >
      <Image
        src="/landing/logo.svg"
        alt=""
        width={32}
        height={32}
        className="shrink-0"
      />
      <span className="font-headline-md text-lg sm:text-headline-md">
        Plan My Marriage
      </span>
    </Link>
  );
}
