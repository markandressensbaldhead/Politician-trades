export type DeploymentDirection = "Long" | "Short" | "Watch" | "Reduce";
export type DeploymentConviction = "High" | "Medium" | "Low";

export interface DeploymentIdea {
  ticker: string;
  direction: DeploymentDirection;
  conviction: DeploymentConviction;
  rationale: string;
  catalyst: string;
  sizeHint: string;
}

export interface AlphaBriefContent {
  headline: string;
  thesis: string;
  deploymentIdeas: DeploymentIdea[];
  sectorTheme: string;
  timingEdge: string;
  riskManagement: string;
  playbook: string;
}

export interface PoliticianAlphaBrief {
  politicianId: string;
  politicianName: string;
  brief: AlphaBriefContent;
  tradesInWindow: number;
  windowDays: number;
  generatedAt: string;
  cached: boolean;
}
