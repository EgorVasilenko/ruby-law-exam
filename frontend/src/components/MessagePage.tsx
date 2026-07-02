import type { ReactElement, ReactNode } from 'react';
import styles from './MessagePage.module.scss';

interface MessagePageProps {
  code?: string;
  title: string;
  message: string;
  action?: ReactNode;
}

/** Shared full-page message layout for 404 / 500 (and any other status page). */
export function MessagePage({ code, title, message, action }: MessagePageProps): ReactElement {
  return (
    <div className={styles.page}>
      {code && <p className={styles.code}>{code}</p>}
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
