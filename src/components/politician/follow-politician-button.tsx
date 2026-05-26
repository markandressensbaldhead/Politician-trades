"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FollowPoliticianButtonProps {
  politicianId: string;
  politicianName: string;
}

export function FollowPoliticianButton({
  politicianId,
  politicianName,
}: FollowPoliticianButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          politician_name: politicianName,
          politician_id: politicianId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to subscribe");
      }

      setSuccess(true);
      setEmail("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to subscribe"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSuccess(false);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-primary/30 bg-primary/5 font-mono text-[11px] uppercase tracking-wider hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
        >
          <Bell className="h-3.5 w-3.5" />
          Follow this Politician
        </Button>
      </DialogTrigger>

      <DialogContent className="terminal-panel border-border/60 bg-card/95 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm uppercase tracking-[0.2em] text-terminal-amber">
            Trade Alerts
          </DialogTitle>
          <DialogDescription>
            Get emailed when {politicianName} files a new stock trade.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-gain" />
            <p className="text-sm">
              You&apos;re subscribed to alerts for{" "}
              <span className="font-medium">{politicianName}</span>.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="mt-2"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert-email" className="font-mono text-xs uppercase">
                Email address
              </Label>
              <Input
                id="alert-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-background/50"
              />
            </div>

            {error && (
              <p className="text-sm text-loss">{error}</p>
            )}

            <DialogFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full font-mono text-xs uppercase tracking-wider sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe to Alerts"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
