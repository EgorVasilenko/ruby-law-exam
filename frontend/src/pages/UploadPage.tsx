import { useNavigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import { UploadForm } from '../components/UploadForm';
import { ErrorMessage } from '../components/ErrorMessage';
import { useContractUpload } from '../hooks/useContractUpload';
import styles from './UploadPage.module.scss';

export function UploadPage(): ReactElement {
  const navigate = useNavigate();
  const { status, stage, error, upload, reset } = useContractUpload();

  const handleSubmit = async (file: File): Promise<void> => {
    const result = await upload(file);
    if (result) navigate(`/contracts/${result.id}`);
  };

  return (
    <div className={styles.page}>
      <p className={styles.tag}>Upload</p>
      <h1 className={styles.display}>Know what you&rsquo;re signing.</h1>
      <p className={styles.lead}>
        Upload a contract and get an instant AI review — type, risk score, missing
        clauses, and plain-English recommendations.
      </p>

      <UploadForm onSubmit={handleSubmit} disabled={status === 'loading'} stage={stage} />

      {status === 'error' && error && <ErrorMessage message={error} onDismiss={reset} />}
    </div>
  );
}
