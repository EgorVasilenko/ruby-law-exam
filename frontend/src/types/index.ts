// Shared types used by the frontend.
// Keep in sync with backend/src/types/index.ts

export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskyClause {
  text: string;
  severity: RiskSeverity;
  reason: string;
}

export interface ContractAIResult {
  type: string;
  riskScore: number;
  missingClauses: string[];
  recommendations: string[];
  riskyClauses: RiskyClause[];
}

export interface ContractAnalysis extends ContractAIResult {
  id: string;
  filename: string;
  fullText: string;
  createdAt: string;
}
