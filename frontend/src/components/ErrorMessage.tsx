import { useEffect, type ReactElement } from 'react';
import styles from './ErrorMessage.module.scss';

interface ErrorMessageProps {
  message: string;
  /** Called to dismiss the toast (on the close button or after the timeout). */
  onDismiss: () => void;
  autoDismissMs?: number;
}

/** Transient error toast (bottom-right), auto-dismisses after `autoDismissMs`. */
export function ErrorMessage({
  message,
  onDismiss,
  autoDismissMs = 10000,
}: ErrorMessageProps): ReactElement {
  useEffect(() => {
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, autoDismissMs]);

  return (
    <div className={styles.toast} role="alert">
      <p className={styles.text}>{message}</p>
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
