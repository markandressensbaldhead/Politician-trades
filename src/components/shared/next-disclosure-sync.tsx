"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import {
  getDisclosureScheduleInfo,
  type DisclosureScheduleInfo,
} from "@/lib/disclosure-schedule";
import { cn } from "@/lib/utils";

interface NextDisclosureSyncProps {
  variant?: "pill" | "inline" | "card";
  className?: string;
}

export function NextDisclosureSync({
  variant = "pill",
  className,
}: NextDisclosureSyncProps) {
  const [info, setInfo] = useState<DisclosureScheduleInfo>(() =>
    getDisclosureScheduleInfo()
  );

  useEffect(() => {
    const refresh = () => setInfo(getDisclosureScheduleInfo());
    refresh();
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, []);

  if (variant === "pill") {
    return (
      <span
        className={cn("status-pill gap-1.5", className)}
        title={info.detail}
      >
        <Clock className="h-3 w-3" />
        {info.headline}
        <span className="text-muted-foreground">· {info.countdown}</span>
      </span>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/80 bg-background/50 p-4",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">{info.headline}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {info.detail}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <Clock className="mr-1 inline h-3 w-3 align-text-bottom" />
      {info.headline} · {info.countdown}
    </p>
  );
}
