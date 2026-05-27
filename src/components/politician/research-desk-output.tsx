"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  parseAnalysisSections,
} from "@/lib/parse-analysis";
import { cn } from "@/lib/utils";

interface ResearchDeskOutputProps {
  analysis: string;
  className?: string;
}

export function ResearchDeskOutput({
  analysis,
  className,
}: ResearchDeskOutputProps) {
  const sections = parseAnalysisSections(analysis);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-5", className)}>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-terminal-amber">
            {section.title}
          </h4>
          <div className="space-y-2 text-sm leading-7 text-foreground/90 sm:text-[15px]">
            <p className="whitespace-pre-line">{section.body}</p>
          </div>
        </section>
      ))}
    </div>
  );
}

interface RefreshAnalysisButtonProps {
  loading?: boolean;
  onRefresh: () => void;
}

export function RefreshAnalysisButton({
  loading = false,
  onRefresh,
}: RefreshAnalysisButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="font-mono text-[10px] uppercase tracking-wider"
      onClick={onRefresh}
      disabled={loading}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      Refresh memo
    </Button>
  );
}
