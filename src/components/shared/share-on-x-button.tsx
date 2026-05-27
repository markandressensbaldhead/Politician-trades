"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildXIntentUrl } from "@/lib/share";
import { cn } from "@/lib/utils";

interface ShareOnXButtonProps {
  text: string;
  url?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  label?: string;
}

export function ShareOnXButton({
  text,
  url,
  size = "default",
  variant = "outline",
  className,
  label = "Share on X",
}: ShareOnXButtonProps) {
  const shareUrl =
    url ??
    (typeof window !== "undefined" ? window.location.href : undefined);
  const href = buildXIntentUrl(text, shareUrl);

  return (
    <Button asChild size={size} variant={variant} className={cn("gap-2", className)}>
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <Share2 className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
