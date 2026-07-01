import type { ReactElement } from 'react';
import type { RiskyClause } from '../types';
import { buildSegments } from '../lib/highlightClauses';
import styles from './HighlightedContract.module.scss';

interface HighlightedContractProps {
  fullText: string;
  riskyClauses: RiskyClause[];
}

export function HighlightedContract({
  fullText,
  riskyClauses,
}: HighlightedContractProps): ReactElement {
  const segments = buildSegments(fullText, riskyClauses);

  return (
    <div className={styles.doc}>
      {segments.map((seg, i) =>
        seg.severity ? (
          <mark
            key={i}
            className={`${styles.mark} ${styles[seg.severity]}`}
            title={seg.reason}
            tabIndex={0}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </div>
  );
}
