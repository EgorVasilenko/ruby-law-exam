import { Link, useParams } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AnalysisResults } from '../components/AnalysisResults';
import { MessagePage } from '../components/MessagePage';
import { Spinner } from '../components/Spinner';
import { useContract } from '../hooks/useContract';
import styles from './ResultPage.module.scss';

export function ResultPage(): ReactElement {
  const { id = '' } = useParams();
  const { status, data, error } = useContract(id);

  return (
    <div className={styles.page}>
      <p className={styles.tag}>Analysis</p>

      {status === 'loading' && <Spinner label="Loading analysis…" />}

      {status === 'error' && (
        <MessagePage
          title="Couldn't load this contract"
          message={error ?? 'Something went wrong.'}
          action={<Link to="/">← Back to upload</Link>}
        />
      )}

      {status === 'success' && data && (
        <>
          <AnalysisResults result={data} />
          <Link to="/" className={styles.back}>
            ← Analyze another contract
          </Link>
        </>
      )}
    </div>
  );
}
