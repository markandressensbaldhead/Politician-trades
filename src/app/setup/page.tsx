"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SiteContainer } from "@/components/layout/site-container";

interface SetupResponse {
  status: {
    supabase: boolean;
    supabaseServiceRole: boolean;
    anthropic: boolean;
    unusualWhales: boolean;
    fmp: boolean;
    quiverQuant: boolean;
    congressData: boolean;
    databaseUrl: boolean;
    cronSecret: boolean;
    resend: boolean;
    appUrl: boolean;
    readyForInsights: boolean;
    missing: string[];
  };
  tables: {
    ok: boolean;
    missingTables: string[];
    error?: string;
  };
  insightsReady: boolean;
}

export default function SetupPage() {
  const [data, setData] = useState<SetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [cronSecret, setCronSecret] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/setup");
      const json = await response.json();
      setData(json);
    } catch {
      setError("Failed to load setup status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function runSetup(mode: "schema" | "full" = "full") {
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      const url =
        mode === "schema" ? "/api/setup?mode=schema" : "/api/setup";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Setup failed");
      }

      setResult(
        json.tables?.ok
          ? mode === "schema"
            ? "Database tables created successfully."
            : json.insightsReady
              ? "Setup complete. AI Insights is ready."
              : "Setup ran, but some items still need attention."
          : "Setup ran, but some tables are still missing."
      );
      await loadStatus();
    } catch (setupError) {
      setError(
        setupError instanceof Error ? setupError.message : "Setup failed"
      );
    } finally {
      setRunning(false);
    }
  }

  function StatusRow({ label, ok }: { label: string; ok: boolean }) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
        <span className="text-sm">{label}</span>
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-gain" />
        ) : (
          <XCircle className="h-4 w-4 text-loss" />
        )}
      </div>
    );
  }

  return (
    <SiteContainer className="py-10">
      <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold">AI Insights Setup</h1>
        <p className="mt-2 text-muted-foreground">
          One-time setup for Supabase tables and AI Insights configuration.
        </p>
      </div>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Environment status
          </CardTitle>
          <CardDescription>
            These must be set in Vercel → Settings → Environment Variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking configuration...
            </div>
          ) : data ? (
            <>
              <StatusRow label="Supabase URL + anon key" ok={data.status.supabase} />
              <StatusRow
                label="Supabase service role key"
                ok={data.status.supabaseServiceRole}
              />
              <StatusRow label="Anthropic API key" ok={data.status.anthropic} />
              <StatusRow
                label="Database URL (auto table setup)"
                ok={data.status.databaseUrl}
              />
              <StatusRow
                label="Unusual Whales API key (primary)"
                ok={data.status.unusualWhales}
              />
              <StatusRow
                label="FMP API key (House + Senate disclosures)"
                ok={data.status.fmp}
              />
              <StatusRow
                label="QuiverQuant API key (returns + alt data)"
                ok={data.status.quiverQuant}
              />
              <StatusRow
                label="Congress trade data ready"
                ok={data.status.congressData}
              />
              <StatusRow label="Database tables exist" ok={data.tables.ok} />
              <StatusRow label="AI Insights ready" ok={data.insightsReady} />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="surface-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Run setup</CardTitle>
          <CardDescription>
            Creates Supabase tables automatically when DATABASE_URL is configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">CRON_SECRET</label>
            <Input
              type="password"
              placeholder="Same value as CRON_SECRET in Vercel"
              value={cronSecret}
              onChange={(event) => setCronSecret(event.target.value)}
            />
          </div>

          <Button
            onClick={() => runSetup("schema")}
            disabled={running || !cronSecret}
            className="w-full"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating tables...
              </>
            ) : (
              "Create database tables"
            )}
          </Button>

          <Button
            onClick={() => runSetup("full")}
            disabled={running || !cronSecret}
            variant="outline"
            className="w-full"
          >
            Initialize Database & Verify AI Insights
          </Button>

          {result && <p className="text-sm text-gain">{result}</p>}
          {error && <p className="text-sm text-loss">{error}</p>}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="text-base">Manual fallback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            If you skip DATABASE_URL, paste <code>supabase/schema.sql</code> into
            Supabase → SQL Editor → Run.
          </p>
          <p>
            Then visit a profile like{" "}
            <Link href="/politician/nancy-pelosi" className="text-primary">
              /politician/nancy-pelosi
            </Link>{" "}
            and wait ~20 seconds for AI Insights to generate.
          </p>
        </CardContent>
      </Card>
      </div>
    </SiteContainer>
  );
}
