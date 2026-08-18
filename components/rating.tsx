import { Star } from "lucide-react";

export function Rating({
  value,
  count,
  compact = false,
}: {
  value: number;
  count?: number;
  compact?: boolean;
}) {
  return (
    <span className={`rating ${compact ? "compact" : ""}`} aria-label={`${value} out of 5 stars`}>
      <span><Star size={compact ? 13 : 14} fill="currentColor" /> {value.toFixed(1)}</span>
      {typeof count === "number" && <small>({count.toLocaleString("en-IN")})</small>}
    </span>
  );
}

