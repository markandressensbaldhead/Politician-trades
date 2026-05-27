"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { parseAnalysisSections } from "@/lib/parse-analysis";
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
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  const blocks: Array<{ type: "list"; items: string[] } | { type: "p"; text: string }> = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: [...listItems] });
      listItems = [];
    }
  };

  for (const line of lines) {
    const bulletMatch = line.match(/^[-*•]\s+(.+)/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      continue;
    }
    flushList();
    blocks.push({ type: "p", text: line });
  }
  flushList();

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "list") {
          return (
            <ul key={`list-${index}`} className="space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="list-disc text-sm leading-7 text-foreground/90"
                >
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`p-${index}`} className="text-sm leading-7 text-foreground/90">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
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
      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-lg border border-border bg-secondary/20 p-5"
        >
          <h4 className="mb-3 text-sm font-semibold text-foreground">
            {section.title}
          </h4>
          <AnalysisBody body={section.body} />
        </section>
      ))}
    </div>
  );
}

export function RefreshAnalysisButton({
  loading = false,
  onRefresh,
}: {
  loading?: boolean;
  onRefresh: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0 text-sm"
      onClick={onRefresh}
      disabled={loading}
    >
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      Refresh
    </Button>
  );
}
