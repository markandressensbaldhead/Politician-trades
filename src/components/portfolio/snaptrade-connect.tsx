"use client";

import { useCallback, useEffect, useState } from "react";
import { Link2, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearSnapTradeSession,
  loadSnapTradeSession,
  saveSnapTradeSession,
} from "@/lib/snaptrade-session-storage";
import { mergeHoldings, savePortfolio } from "@/lib/portfolio-storage";
import { PortfolioHolding, SavedPortfolio } from "@/types/portfolio";

interface SnapTradeConnectProps {
  portfolio: SavedPortfolio | null;
  onPortfolioChange: (portfolio: SavedPortfolio | null) => void;
  onStatusMessage: (message: string | null) => void;
  onError: (message: string | null) => void;
}

async function ensureSnapTradeSession() {
  const existing = loadSnapTradeSession();

  if (existing) {
    return existing;
  }

  const response = await fetch("/api/snaptrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register" }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to create SnapTrade session");
  }

  const session = {
    userId: data.userId as string,
    userSecret: data.userSecret as string,
  };

  saveSnapTradeSession(session);
  return session;
}

export function SnapTradeConnect({
  portfolio,
  onPortfolioChange,
  onStatusMessage,
  onError,
}: SnapTradeConnectProps) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    fetch("/api/snaptrade")
      .then((response) => response.json())
      .then((data) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    setLinked(Boolean(loadSnapTradeSession()));
  }, [portfolio]);

  const syncHoldings = useCallback(async () => {
    const session = loadSnapTradeSession();

    if (!session) {
      onError("Connect Robinhood first.");
      return;
    }

    setSyncing(true);
    onError(null);

    try {
      const response = await fetch("/api/snaptrade/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to sync Robinhood holdings");
      }

      const imported = (data.holdings ?? []) as PortfolioHolding[];

      if (imported.length === 0) {
        onStatusMessage(
          "Robinhood is connected, but no stock positions were found yet. Try again in a minute if you just linked."
        );
        return;
      }

      const nextPortfolio: SavedPortfolio = {
        broker: "snaptrade",
        holdings: mergeHoldings([], imported),
        updatedAt: new Date().toISOString(),
        label: data.accountLabel ?? "Robinhood",
      };

      savePortfolio(nextPortfolio);
      onPortfolioChange(nextPortfolio);
      onStatusMessage(
        `Synced ${imported.length} Robinhood positions via secure OAuth.`
      );
    } catch (syncError) {
      onError(
        syncError instanceof Error
          ? syncError.message
          : "Failed to sync Robinhood holdings"
      );
    } finally {
      setSyncing(false);
    }
  }, [onError, onPortfolioChange, onStatusMessage]);

  async function connectRobinhood() {
    setConnecting(true);
    onError(null);
    onStatusMessage(null);

    try {
      const session = await ensureSnapTradeSession();

      const response = await fetch("/api/snaptrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connect",
          userId: session.userId,
          userSecret: session.userSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to start Robinhood connection");
      }

      window.location.href = data.redirectURI as string;
    } catch (connectError) {
      onError(
        connectError instanceof Error
          ? connectError.message
          : "Failed to connect Robinhood"
      );
      setConnecting(false);
    }
  }

  function disconnectRobinhood() {
    clearSnapTradeSession();
    setLinked(false);
    onStatusMessage("Robinhood connection removed from this browser.");
  }

  if (configured === false) {
    return (
      <div className="rounded-lg border border-border bg-secondary/20 p-5">
        <p className="text-sm font-medium">One-click Robinhood linking</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Add{" "}
          <code className="rounded bg-background px-1 py-0.5 text-[11px]">
            SNAPTRADE_CLIENT_ID
          </code>{" "}
          and{" "}
          <code className="rounded bg-background px-1 py-0.5 text-[11px]">
            SNAPTRADE_CONSUMER_KEY
          </code>{" "}
          in Vercel to enable secure OAuth via SnapTrade. CSV import remains
          available below.
        </p>
      </div>
    );
  }

  if (configured === null) {
    return null;
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Connect Robinhood securely</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            OAuth read-only access through SnapTrade — your Robinhood password
            never touches this app.
          </p>
          {linked && (
            <Badge className="status-pill-live mt-2">
              Robinhood session active
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!linked ? (
            <Button onClick={connectRobinhood} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening Robinhood...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Connect Robinhood
                </>
              )}
            </Button>
          ) : (
            <>
              <Button onClick={syncHoldings} disabled={syncing}>
                {syncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync holdings
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={disconnectRobinhood}>
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function useSnapTradeCallbackSync(
  onPortfolioChange: (portfolio: SavedPortfolio | null) => void,
  onStatusMessage: (message: string | null) => void,
  onError: (message: string | null) => void
) {
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("snaptrade") !== "connected") return;

    setHandled(true);
    params.delete("snaptrade");
    const nextUrl = `${window.location.pathname}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    window.history.replaceState({}, "", nextUrl);

    async function autoSync() {
      const session = loadSnapTradeSession();
      if (!session) {
        onError("Robinhood connected, but local session was missing. Try connecting again.");
        return;
      }

      onStatusMessage("Robinhood connected. Syncing your holdings...");

      try {
        const response = await fetch("/api/snaptrade/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(session),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to sync holdings");
        }

        const imported = (data.holdings ?? []) as PortfolioHolding[];

        if (imported.length === 0) {
          onStatusMessage(
            "Robinhood linked successfully. Positions may take a minute to appear — click Sync holdings."
          );
          return;
        }

        const nextPortfolio: SavedPortfolio = {
          broker: "snaptrade",
          holdings: mergeHoldings([], imported),
          updatedAt: new Date().toISOString(),
          label: data.accountLabel ?? "Robinhood",
        };

        savePortfolio(nextPortfolio);
        onPortfolioChange(nextPortfolio);
        onStatusMessage(
          `Robinhood linked — synced ${imported.length} positions automatically.`
        );
      } catch (syncError) {
        onError(
          syncError instanceof Error
            ? syncError.message
            : "Failed to sync after connecting Robinhood"
        );
      }
    }

    void autoSync();
  }, [handled, onError, onPortfolioChange, onStatusMessage]);
}
