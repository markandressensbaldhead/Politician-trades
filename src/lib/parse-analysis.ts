export interface AnalysisSection {
  title: string;
  body: string;
}

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

export function renderAnalysisBody(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, "• "));
}
