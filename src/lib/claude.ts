const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a financial analyst specializing in congressional trading patterns. Given a politician's trade history, write a 3-paragraph plain English analysis covering: their sector biases, timing patterns relative to legislation they're involved with, and an overall trading style profile. Be specific and cite actual tickers. Write for a retail investor audience.`;

interface ClaudeResponse {
  content: Array<{ type: string; text?: string }>;
}

export async function generateTradeAnalysis(
  tradeHistoryText: string,
  politicianName: string
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
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze the following trade history for ${politicianName}:\n\n${tradeHistoryText}`,
        },
      ],
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
