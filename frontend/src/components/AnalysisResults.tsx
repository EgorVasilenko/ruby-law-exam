import type { ReactElement } from 'react';
import type { ContractAnalysis } from '../types';
import styles from './AnalysisResults.module.scss';

type RiskLevel = 'low' | 'moderate' | 'high';

function riskBand(score: number): { label: string; level: RiskLevel } {
  if (score < 40) return { label: 'Low', level: 'low' };
  if (score < 70) return { label: 'Moderate', level: 'moderate' };
  return { label: 'High', level: 'high' };
}

interface AnalysisResultsProps {
  result: ContractAnalysis;
}

export function AnalysisResults({ result }: AnalysisResultsProps): ReactElement {
  const { label, level } = riskBand(result.riskScore);

  return (
    <section className={styles.results}>
      <header className={styles.header}>
        <div className={styles.meta}>
          <p className={styles.filename}>{result.filename}</p>
          <span className={styles.typeBadge}>{result.type}</span>
        </div>
        <div className={`${styles.risk} ${styles[level]}`}>
          <span className={styles.riskScore}>{result.riskScore}</span>
          <span className={styles.riskLabel}>{label} risk</span>
        </div>
      </header>

      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Missing clauses</h3>
        {result.missingClauses.length === 0 ? (
          <p className={styles.empty}>No missing clauses detected</p>
        ) : (
          <ul className={styles.list}>
            {result.missingClauses.map((clause) => (
              <li key={clause}>{clause}</li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Recommendations</h3>
        {result.recommendations.length === 0 ? (
          <p className={styles.empty}>No recommendations</p>
        ) : (
          <ul className={styles.list}>
            {result.recommendations.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
