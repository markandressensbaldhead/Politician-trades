import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HousePtrFiling } from "@/lib/house-clerk";
import { formatDate } from "@/lib/utils";

interface OfficialPtrPanelProps {
  filings: HousePtrFiling[];
}

export function OfficialPtrPanel({ filings }: OfficialPtrPanelProps) {
  if (filings.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.05] via-card to-card">
      <CardHeader className="border-b border-border/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-emerald-500/30 text-[10px]">
            House Clerk
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            Official PTR filings
          </Badge>
        </div>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          Fresh from disclosures.house.gov
        </CardTitle>
        <CardDescription>
          Direct from the U.S. House Clerk STOCK Act index — official PDF links
          before third-party aggregators finish parsing them.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {filings.slice(0, 8).map((filing) => (
          <div
            key={`${filing.docId}-${filing.year}`}
            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <Link
                href={`/politician/${filing.politicianId}`}
                className="font-medium hover:text-primary"
              >
                {filing.politicianName}
              </Link>
              <p className="text-xs text-muted-foreground">
                {filing.state}
                {filing.district ? `-${filing.district}` : ""} · Filed{" "}
                {formatDate(filing.filingDate)} · {filing.filingType === "P" ? "PTR" : "Amendment"}
              </p>
            </div>
            <a
              href={filing.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Official PDF
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
