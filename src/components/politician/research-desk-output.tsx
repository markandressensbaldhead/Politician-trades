"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  parseAnalysisSections,
  parseBodyBlocks,
} from "@/lib/parse-analysis";
import { cn } from "@/lib/utils";

interface ResearchDeskOutputProps {
  analysis: string;
  className?: string;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

function AnalysisBody({ body }: { body: string }) {
  const blocks = parseBodyBlocks(body);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul
              key={`list-${index}`}
              className="space-y-2.5 border-l-2 border-border/60 pl-4"
            >
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="text-[15px] leading-7 text-foreground/90"
                >
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={`p-${index}`}
            className="text-[15px] leading-7 text-foreground/90"
          >
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function getDeskViewTone(title: string, body: string): "constructive" | "neutral" | "cautious" | null {
  if (!title.toLowerCase().includes("desk view")) {
    return null;
  }

  const text = body.toLowerCase();

  if (text.includes("constructive") || text.includes("high")) {
    return "constructive";
  }

  if (text.includes("cautious") || text.includes("low")) {
    return "cautious";
  }

  return "neutral";
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
    <div className={cn("space-y-4", className)}>
      {sections.map((section) => {
        const isExecutive = section.title.toLowerCase().includes("executive");
        const deskTone = getDeskViewTone(section.title, section.body);

        return (
          <section
            key={section.title}
            className={cn(
              "rounded-lg border border-border/50 bg-background/25 p-4 sm:p-5",
              isExecutive && "border-l-[3px] border-l-terminal-amber/70 bg-background/40",
              deskTone === "constructive" &&
                "border-gain/30 bg-gain/[0.06]",
              deskTone === "cautious" && "border-loss/30 bg-loss/[0.06]",
              deskTone === "neutral" &&
                "border-terminal-amber/30 bg-terminal-amber/[0.06]"
            )}
          >
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-terminal-amber">
              {section.title}
            </h4>
            <AnalysisBody body={section.body} />
          </section>
        );
      })}
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
      className="shrink-0 text-xs"
      onClick={onRefresh}
      disabled={loading}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      Refresh memo
    </Button>
  );
}
