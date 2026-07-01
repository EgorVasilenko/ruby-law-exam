import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import type { ReactElement } from 'react';
import { UploadPage } from './pages/UploadPage';
import { ResultPage } from './pages/ResultPage';
import styles from './App.module.scss';

export default function App(): ReactElement {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link to="/" className={styles.brand}>
              contract<span>·analysis</span>
            </Link>
            <span className={styles.eyebrow}>Ruby Law</span>
          </div>
        </header>
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/contracts/:id" element={<ResultPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
