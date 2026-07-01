import type { ReactElement } from 'react';
import styles from './ErrorMessage.module.scss';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps): ReactElement {
  return (
    <div className={styles.error} role="alert">
      <p className={styles.text}>{message}</p>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
