import { Party } from "@/types";
import { cn } from "@/lib/utils";

interface PartyBadgeProps {
  party: Party;
  className?: string;
}

const partyStyles: Record<Party, string> = {
  Democrat: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  Republican: "border-red-500/30 bg-red-500/10 text-red-300",
  Independent: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

const partyLabels: Record<Party, string> = {
  Democrat: "Democrat",
  Republican: "Republican",
  Independent: "Independent",
};

export function PartyBadge({ party, className }: PartyBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        partyStyles[party],
        className
      )}
    >
      {partyLabels[party]}
    </span>
  );
}
