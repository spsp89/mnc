import Link from "next/link";

export function Brand({
  href = "/",
  homeLabel = "BNC home",
}: {
  href?: string;
  homeLabel?: string;
}) {
  return (
    <Link className="brand" href={href} aria-label={homeLabel}>
      <span className="brand-word">
        BNC
        <small>Business Network Community</small>
      </span>
    </Link>
  );
}
