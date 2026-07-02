import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import type { ReactElement } from 'react';
import { UploadPage } from './pages/UploadPage';
import { ResultPage } from './pages/ResultPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorBoundary } from './components/ErrorBoundary';
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
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<UploadPage />} />
              <Route path="/contracts/:id" element={<ResultPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </BrowserRouter>
  );
}
