import type { ReactElement } from 'react';
import type { ContractAnalysis, RiskSeverity } from '../types';
import { riskBand } from '../lib/riskLevel';
import { HighlightedContract } from './HighlightedContract';
import styles from './AnalysisResults.module.scss';

const SEVERITY_LABEL: Record<RiskSeverity, string> = { low: 'Low', medium: 'Med', high: 'High' };

interface AnalysisResultsProps {
  result: ContractAnalysis;
}

export function AnalysisResults({ result }: AnalysisResultsProps): ReactElement {
  const { label, level } = riskBand(result.riskScore);
  const chipClass: Record<RiskSeverity, string> = {
    low: styles.chipLow,
    medium: styles.chipMed,
    high: styles.chipHigh,
  };

  return (
    <section className={styles.results}>
      <header className={styles.head}>
        <div className={styles.meta}>
          <h2 className={styles.filename}>{result.filename}</h2>
          <span className={styles.typeBadge}>{result.type}</span>
        </div>
        <div className={styles.score}>
          <div className={`${styles.num} ${styles[level]}`}>{result.riskScore}</div>
          <div className={styles.caption}>
            Risk score
            <b className={styles[level]}>{label}</b>
          </div>
        </div>
      </header>

      {result.riskyClauses.length > 0 && (
        <div className={styles.block}>
          <p className={styles.label}>Risk flags</p>
          <div className={styles.flags}>
            {result.riskyClauses.map((clause, i) => (
              <div className={styles.flag} key={i}>
                <span className={`${styles.chip} ${chipClass[clause.severity]}`}>
                  {SEVERITY_LABEL[clause.severity]}
                </span>
                <div>
                  <p className={styles.quote}>“{clause.text}”</p>
                  <p className={styles.reason}>{clause.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.riskyClauses.length > 0 && result.fullText && (
        <div className={styles.block}>
          <p className={styles.label}>Contract · hover a highlight for why</p>
          <HighlightedContract fullText={result.fullText} riskyClauses={result.riskyClauses} />
        </div>
      )}

      <div className={`${styles.block} ${styles.cols2}`}>
        <div>
          <p className={styles.label}>Missing clauses</p>
          {result.missingClauses.length === 0 ? (
            <p className={styles.empty}>No missing clauses detected</p>
          ) : (
            <div className={styles.rows}>
              {result.missingClauses.map((clause) => (
                <div className={styles.row} key={clause}>
                  <span className={styles.dot}>—</span> {clause}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className={styles.label}>Recommendations</p>
          {result.recommendations.length === 0 ? (
            <p className={styles.empty}>No recommendations</p>
          ) : (
            <div className={styles.rows}>
              {result.recommendations.map((rec) => (
                <div className={styles.row} key={rec}>
                  <span className={styles.dot}>→</span> {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
