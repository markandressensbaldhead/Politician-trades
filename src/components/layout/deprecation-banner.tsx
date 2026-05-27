import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { DEPRECATION } from "@/lib/site-status";

export function DeprecationBanner() {
  return (
    <div
      role="status"
      className="border-b border-amber-500/30 bg-amber-500/10 text-amber-100"
    >
      <div className="layout-shell flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-50">
              {DEPRECATION.title}
            </p>
            <p className="text-xs leading-relaxed text-amber-100/80">
              {DEPRECATION.message} Effective {DEPRECATION.effectiveDate}.
            </p>
          </div>
        </div>
        <Link
          href={`mailto:${DEPRECATION.contact}`}
          className="text-xs font-medium text-amber-200 underline-offset-4 hover:underline"
        >
          Questions? {DEPRECATION.contact}
        </Link>
      </div>
    </div>
  );
}
