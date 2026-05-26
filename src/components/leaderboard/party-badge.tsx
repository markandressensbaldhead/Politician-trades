import { Party } from "@/types";
import { cn } from "@/lib/utils";

interface PartyBadgeProps {
  party: Party;
  className?: string;
}

const partyStyles: Record<Party, string> = {
  Democrat:
    "border-blue-500/40 bg-blue-500/10 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
  Republican:
    "border-red-500/40 bg-red-500/10 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  Independent:
    "border-zinc-500/40 bg-zinc-500/10 text-zinc-400",
};

const partyLabels: Record<Party, string> = {
  Democrat: "DEM",
  Republican: "GOP",
  Independent: "IND",
};

export function PartyBadge({ party, className }: PartyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
        partyStyles[party],
        className
      )}
    >
      {partyLabels[party]}
    </span>
  );
}
