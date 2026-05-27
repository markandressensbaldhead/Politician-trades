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
        <Button variant="outline" className="gap-2 text-sm">
          <Bell className="h-4 w-4" />
          Get trade alerts
        </Button>
      </DialogTrigger>

      <DialogContent className="surface-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Email alerts
          </DialogTitle>
          <DialogDescription>
            We&apos;ll email you when {politicianName} reports a new trade.
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
              <Label htmlFor="alert-email">Email address</Label>
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
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
