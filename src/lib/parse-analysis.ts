export interface AnalysisSection {
  title: string;
  body: string;
}

export type BodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export function parseAnalysisSections(analysis: string): AnalysisSection[] {
  const trimmed = analysis.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.includes("\n## ")) {
    const chunks = trimmed.split(/\n(?=## )/);

    return chunks
      .map((chunk) => {
        const lines = chunk.trim().split("\n");
        const titleLine = lines[0]?.replace(/^##\s*/, "").trim() ?? "Analysis";
        const body = lines.slice(1).join("\n").trim();

        return { title: titleLine, body };
      })
      .filter((section) => section.body.length > 0 || section.title.length > 0);
  }

  return trimmed
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => ({
      title: index === 0 ? "Analysis" : `Note ${index + 1}`,
      body: paragraph,
    }));
}

export function parseBodyBlocks(body: string): BodyBlock[] {
  const lines = body.split("\n").map((line) => line.trim());
  const blocks: BodyBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: [...listItems] });
      listItems = [];
    }
  };

  for (const line of lines) {
    if (!line) {
      flushList();
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)/);

    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: line });
  }

  flushList();
  return blocks;
}

export function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}
