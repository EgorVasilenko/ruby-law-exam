import { Link, useParams } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AnalysisResults } from '../components/AnalysisResults';
import { ErrorMessage } from '../components/ErrorMessage';
import { Spinner } from '../components/Spinner';
import { useContract } from '../hooks/useContract';
import styles from './ResultPage.module.scss';

export function ResultPage(): ReactElement {
  const { id = '' } = useParams();
  const { status, data, error } = useContract(id);

  return (
    <div className={styles.page}>
      {status === 'loading' && <Spinner label="Loading analysis…" />}
      {status === 'error' && (
        <ErrorMessage message={error ?? 'Failed to load contract'} />
      )}
      {status === 'success' && data && <AnalysisResults result={data} />}

      <Link to="/" className={styles.back}>
        ← Analyze another contract
      </Link>
    </div>
  );
}
