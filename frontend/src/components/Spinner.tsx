import type { ReactElement } from 'react';
import styles from './Spinner.module.scss';

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label }: SpinnerProps): ReactElement {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.spinner} />
      {label && <p className={styles.label}>{label}</p>}
    </div>
  );
}
