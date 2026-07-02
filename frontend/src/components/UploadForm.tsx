import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from '../config';
import type { UploadStage } from '../types';
import { ArrowUpIcon, CheckIcon, SpinnerIcon } from './icons';
import styles from './UploadForm.module.scss';

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];
const ACCEPTED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const STAGE_LABEL: Record<UploadStage, string> = {
  uploading: 'Uploading…',
  extracting: 'Extracting text…',
  analyzing: 'Analyzing…',
  done: 'Done',
};

function stageIcon(stage: UploadStage | null, spinClass: string): ReactElement {
  if (stage === 'extracting' || stage === 'analyzing') return <SpinnerIcon className={spinClass} />;
  if (stage === 'done') return <CheckIcon />;
  return <ArrowUpIcon />; // idle + uploading
}

const STAGE_FRACTION: Record<UploadStage, number> = {
  uploading: 0.3,
  extracting: 0.6,
  analyzing: 0.9,
  done: 1,
};

interface UploadFormProps {
  onSubmit: (file: File) => void;
  disabled?: boolean;
  /** When set, the button shows the stage and a thin progress bar appears. */
  stage?: UploadStage | null;
}

function validate(file: File): string | null {
  const name = file.name.toLowerCase();
  const okExt = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const okMime = ACCEPTED_MIME.includes(file.type);
  if (!okExt && !okMime) return 'Only .pdf and .docx files are accepted';
  if (file.size > MAX_UPLOAD_BYTES) return `File exceeds the ${MAX_UPLOAD_MB} MB limit`;
  return null;
}

export function UploadForm({
  onSubmit,
  disabled = false,
  stage = null,
}: UploadFormProps): ReactElement {
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

  const isWorking = stage === 'uploading' || stage === 'extracting' || stage === 'analyzing';

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

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.submit} ${stage ? styles.active : ''} ${isWorking ? styles.blink : ''}`}
          onClick={() => file && onSubmit(file)}
          disabled={!file || disabled || stage !== null}
        >
          <span>{stage ? STAGE_LABEL[stage] : 'Analyze contract'}</span>
          <span className={styles.icon}>{stageIcon(stage, styles.spin)}</span>
        </button>

        {stage && (
          <div className={styles.progress} role="status" aria-live="polite" aria-label={STAGE_LABEL[stage]}>
            <i style={{ width: `${STAGE_FRACTION[stage] * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
