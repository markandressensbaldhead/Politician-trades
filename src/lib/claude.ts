const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-6";

const TRADE_SYSTEM_PROMPT = `You are a financial analyst specializing in congressional trading patterns. Given a politician's trade history, write a 3-paragraph plain English analysis covering: their sector biases, timing patterns relative to legislation they're involved with, and an overall trading style profile. Be specific and cite actual tickers. Write for a retail investor audience.`;

const FILING_SYSTEM_PROMPT = `You are a financial research analyst reviewing SEC EDGAR filings in the context of congressional stock trading disclosures.

Given filing excerpts and known trades, write a concise 3-paragraph analysis covering:
1. What the SEC filings reveal (forms, dates, entities, material events)
2. How filing content relates to the politician's disclosed trades (timing, tickers, potential overlaps or gaps)
3. What a retail investor should watch for next

Be factual, cite specific forms/tickers/dates from the input, and clearly note when filings are about companies traded rather than the politician's personal PTR. Do not invent data not present in the filings or trade list.`;

interface ClaudeResponse {
  content: Array<{ type: string; text?: string }>;
}

async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
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
      max_tokens: 1400,
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
    `Analyze the following trade history for ${politicianName}:\n\n${tradeHistoryText}`
  );
}

export async function generateFilingAnalysis(
  filingContextText: string,
  politicianName: string
): Promise<string> {
  return callClaude(
    FILING_SYSTEM_PROMPT,
    `Review these SEC EDGAR filings and trade context for ${politicianName}:\n\n${filingContextText}`
  );
}

export async function extractFilingData(
  filingExcerpt: string,
  politicianName: string,
  ticker?: string
): Promise<string> {
  return callClaude(
    `You extract structured facts from SEC filing text. Return bullet points only with: filing type, key dates, transaction details, dollar/value ranges if present, and issuer/ticker references. If data is missing, say so. Do not speculate.`,
    `Extract key financial disclosure data from this filing excerpt${
      ticker ? ` related to ${ticker}` : ""
    } for research on ${politicianName}:\n\n${filingExcerpt}`
  );
}
