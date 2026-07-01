export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskyClause {
  /** Exact quote from the contract, used to locate it in the text. */
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
  /** Full extracted contract text — returned so the UI can highlight clauses. */
  fullText: string;
  createdAt: string;
}
