import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '../config';
import styles from './UploadForm.module.scss';

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

interface UploadFormProps {
  onSubmit: (file: File) => void;
  disabled?: boolean;
}

function validate(file: File): string | null {
  const name = file.name.toLowerCase();
  const okExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const okMime = ACCEPTED_MIME.includes(file.type);
  if (!okExt && !okMime) return 'Only .pdf and .docx files are accepted';
  if (file.size > MAX_UPLOAD_BYTES) return `File exceeds the ${MAX_UPLOAD_MB} MB limit`;
  return null;
}

export function UploadForm({ onSubmit, disabled = false }: UploadFormProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const selectFile = (candidate: File | undefined): void => {
    if (!candidate) return;
    const validationError = validate(candidate);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    selectFile(e.target.files?.[0]);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    selectFile(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const openPicker = (): void => {
    if (!disabled) inputRef.current?.click();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  };

  return (
    <div className={styles.form}>
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload a contract file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className={styles.input}
          onChange={onInputChange}
          disabled={disabled}
        />
        <p className={styles.hint}>
          {file ? file.name : 'Drag & drop a .pdf or .docx contract here, or click to browse'}
        </p>
        <p className={styles.sub}>Max {MAX_UPLOAD_MB} MB</p>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className={styles.submit}
        onClick={() => file && onSubmit(file)}
        disabled={!file || disabled}
      >
        Analyze contract <span className={styles.arrow}>→</span>
      </button>
    </div>
  );
}
