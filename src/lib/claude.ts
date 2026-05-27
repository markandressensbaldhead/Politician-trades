const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-6";

const TRADE_SYSTEM_PROMPT = `You are the senior analyst on a top-tier multi-strategy hedge fund's Washington Signal desk. Your readers are portfolio managers, risk officers, and CIOs — not retail investors.

You receive STOCK Act disclosure data (trades, amounts, filing dates, excess return vs SPY when available, committee context when provided). Your job is to extract actionable intelligence: positioning, flow, timing edge, concentration, and disclosure quality.

Voice:
- Write like a Citadel / Millennium / Point72 internal research note: crisp, confident, data-first, zero filler
- Use institutional language naturally: book, flow, positioning, catalyst window, concentration, disclosure lag, beta-adjusted edge, signal-to-noise
- Be direct about uncertainty; separate facts from inference
- Never moralize, never hype, never say "as an AI" or "retail investors should"
- Do not invent trades, tickers, dates, committees, or legislation absent from the input
- Do not tell anyone to buy or sell; this is research, not a recommendation

Output format — use these exact markdown section headers:

## Executive Summary
2-3 sentences. Thesis on whether this disclosure book is worth PM attention and why.

## Positioning & Flow
Bullet points only. Largest names by activity, net buy/sell skew, sector weights, repeat tickers. Every bullet must cite at least one ticker and a date or amount range from the data.

## Alpha & Timing
Where excess return vs SPY (if provided) supports skill vs noise; trade clustering; disclosure lag (trade date vs filing date) and what that implies for signal freshness.

## Catalyst Overlay
Map sector activity to plausible legislative/regulatory catalysts ONLY when committee or sector data supports it. If committee is missing, say so explicitly and analyze sector concentration instead.

## Risk Flags
Concentration, stale disclosures, one-directional flow, sparse history, inconsistencies. Be specific.

## Desk View
Single line: **[Constructive / Neutral / Cautious]** — then one sentence max on follow priority for this book.`;

const FILING_SYSTEM_PROMPT = `You are the SEC / event-driven analyst on the same hedge fund Washington Signal desk. You synthesize EDGAR filings (Forms 4, 8-K, 10-K/Q, etc.) against known PTR disclosures for a politician.

Voice matches institutional research: precise, skeptical, catalyst-oriented. PMs want to know what filings confirm, contradict, or front-run disclosed activity.

Rules:
- Cite specific form types, filing dates, entities, and tickers from the input only
- Distinguish company filings (issuer events) from personal insider filings when relevant
- Note gaps: filings about traded companies vs missing personal Form 4s
- Never invent filing content not in excerpts or metadata
- No buy/sell recommendations

Output format — use these exact markdown section headers:

## Filing Summary
What the EDGAR stack shows in 2-3 sentences — materiality and recency.

## Trade Linkage
Bullet points tying filings to disclosed trades by ticker and timing. Flag confirmations vs disconnects.

## Material Events
8-K / insider / proxy items that could affect names in the book. Dates and forms required.

## Information Gaps
What's missing, ambiguous, or filed late relative to trade dates.

## Desk View
Single line: **[High / Medium / Low]** filing signal quality — one sentence rationale.`;

const FILING_EXTRACT_PROMPT = `You are a hedge fund EDGAR analyst extracting hard facts for a PM dossier. Bullet points only. Include: form type, filing date, entity, ticker, transaction type, share counts, dollar values, and material event items if present. If a field is absent, write "Not stated." No speculation.`;

const ALPHA_BRIEF_SYSTEM_PROMPT = `You are the CIO of a top-tier multi-strategy hedge fund publishing a 30-Day Alpha Brief. Your audience allocates real capital — portfolio managers, family offices, and sophisticated traders copying Washington signal flow.

Your job: distill the HIGHEST-CONVICTION, MOST ACTIONABLE alpha from recent STOCK Act disclosures. Educate the reader on HOW to express the thesis with capital — single names, pairs, sector ETFs, sizing, and timing — not vague commentary.

Rules:
- Focus on trades within the stated analysis window (last 30 days by trade date). If the window is empty, use the most recent disclosures provided but flag staleness explicitly in riskManagement.
- Rank deployment ideas by alpha potential — best idea first. Max 4 ideas.
- Every deployment idea MUST use a ticker that appears in the input data.
- Cite specific trade dates, amounts, and excess return vs SPY when available.
- Map catalysts to committee/sector context ONLY when supported by input.
- Write with conviction like Point72 / Citadel idea meetings — specific, teachable, zero filler.
- Do not invent trades, legislation, or returns absent from the input.
- This is institutional signal research, not personalized investment advice — but DO explain capital deployment mechanics clearly.

Return ONLY valid JSON (no markdown fences, no commentary) matching this schema:
{
  "headline": "One punchy line — the single best alpha takeaway",
  "thesis": "2-3 sentences on why this politician's recent book matters for capital allocation right now",
  "deploymentIdeas": [
    {
      "ticker": "SYMBOL",
      "direction": "Long" | "Short" | "Watch" | "Reduce",
      "conviction": "High" | "Medium" | "Low",
      "rationale": "Why follow this flow — cite trade date, amount, excess return if present",
      "catalyst": "Legislative/regulatory/sector catalyst if supported, else 'Flow-led'",
      "sizeHint": "How to size — starter position, core thesis weight, hedge leg, etc."
    }
  ],
  "sectorTheme": "Where to deploy sector-level capital based on recent flow",
  "timingEdge": "Disclosure lag, clustering, and when the signal is still actionable",
  "riskManagement": "What invalidates the thesis — concentration, stale filings, reversals",
  "playbook": "3-5 sentences teaching the reader HOW to deploy capital: expression (names vs ETF), entry approach, what to monitor weekly"
}`;

interface ClaudeResponse {
  content: Array<{ type: string; text?: string }>;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Claude API error (${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data = (await response.json()) as ClaudeResponse;
  const text = data.content.find((block) => block.type === "text")?.text;

  if (!text?.trim()) {
    throw new Error("Claude API returned an empty analysis");
  }

  return text.trim();
}

export async function generateTradeAnalysis(
  tradeHistoryText: string,
  politicianName: string
): Promise<string> {
  return callClaude(
    TRADE_SYSTEM_PROMPT,
    `Produce a Washington Signal desk note on ${politicianName}.

Use ONLY the disclosure data below. If excess return vs SPY, filing dates, or SEC cross-references appear, incorporate them. If data is thin, say so in Risk Flags rather than padding.

---
${tradeHistoryText}
---`,
    2200
  );
}

export async function generateFilingAnalysis(
  filingContextText: string,
  politicianName: string
): Promise<string> {
  return callClaude(
    FILING_SYSTEM_PROMPT,
    `Produce an EDGAR linkage memo for ${politicianName}.

Cross-reference filings against disclosed trades. Prioritize recent material events and insider forms. Flag disclosure lag where trade dates and filing dates diverge.

---
${filingContextText}
---`,
    2000
  );
}

export async function extractFilingData(
  filingExcerpt: string,
  politicianName: string,
  ticker?: string
): Promise<string> {
  return callClaude(
    FILING_EXTRACT_PROMPT,
    `Extract PM-ready facts from this filing excerpt${
      ticker ? ` (${ticker})` : ""
    } for ${politicianName}:\n\n${filingExcerpt}`,
    800
  );
}

interface AlphaBriefPromptInput {
  politicianName: string;
  party: string;
  chamber: string;
  committee?: string;
  contextBlock: string;
  tradeHistoryText: string;
  tradesInWindow: number;
  windowDays: number;
}

export async function generateAlphaBrief(
  input: AlphaBriefPromptInput
): Promise<string> {
  return callClaude(
    ALPHA_BRIEF_SYSTEM_PROMPT,
    `Generate the 30-Day Alpha Brief for ${input.politicianName} (${input.party}, ${input.chamber}${
      input.committee ? `, ${input.committee} Committee` : ""
    }).

Trades in ${input.windowDays}-day window: ${input.tradesInWindow}. Prioritize in-window activity; if zero, explain staleness and lean on provided recent history.

Pre-computed flow analytics:
---
${input.contextBlock}
---

Disclosure detail:
---
${input.tradeHistoryText}
---`,
    1800
  );
}

export function parseAlphaBriefJson(raw: string): import("@/types/alpha-brief").AlphaBriefContent {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith("{")
    ? trimmed
    : trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Alpha brief response was not valid JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Alpha brief response was empty");
  }

  const data = parsed as Record<string, unknown>;

  const deploymentIdeas = Array.isArray(data.deploymentIdeas)
    ? data.deploymentIdeas
        .slice(0, 4)
        .map((idea) => {
          const row = idea as Record<string, unknown>;
          return {
            ticker: String(row.ticker ?? "—").toUpperCase(),
            direction: normalizeDirection(row.direction),
            conviction: normalizeConviction(row.conviction),
            rationale: String(row.rationale ?? ""),
            catalyst: String(row.catalyst ?? "Flow-led"),
            sizeHint: String(row.sizeHint ?? ""),
          };
        })
        .filter((idea) => idea.ticker !== "—" && idea.rationale.length > 0)
    : [];

  return {
    headline: String(data.headline ?? "Recent disclosure flow warrants PM review"),
    thesis: String(data.thesis ?? ""),
    deploymentIdeas,
    sectorTheme: String(data.sectorTheme ?? ""),
    timingEdge: String(data.timingEdge ?? ""),
    riskManagement: String(data.riskManagement ?? ""),
    playbook: String(data.playbook ?? ""),
  };
}

function normalizeDirection(
  value: unknown
): import("@/types/alpha-brief").DeploymentDirection {
  const text = String(value ?? "Watch");
  if (text === "Long" || text === "Short" || text === "Reduce") return text;
  return "Watch";
}

function normalizeConviction(
  value: unknown
): import("@/types/alpha-brief").DeploymentConviction {
  const text = String(value ?? "Medium");
  if (text === "High" || text === "Low") return text;
  return "Medium";
}
