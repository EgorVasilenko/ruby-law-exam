export type RiskLevel = 'low' | 'moderate' | 'high';

/** Maps a 0–100 risk score to a labelled band (thresholds: <40, 40–69, 70+). */
export function riskBand(score: number): { label: string; level: RiskLevel } {
  if (score < 40) return { label: 'Low', level: 'low' };
  if (score < 70) return { label: 'Moderate', level: 'moderate' };
  return { label: 'High', level: 'high' };
}
