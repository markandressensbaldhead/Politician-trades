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
