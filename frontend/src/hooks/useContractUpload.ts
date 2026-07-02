import { useCallback, useState } from 'react';
import { uploadContractStream } from '../api/contracts';
import type { ContractAnalysis, UploadStage } from '../types';

type Status = 'idle' | 'loading' | 'error';

interface UseContractUpload {
  status: Status;
  /** Current progress stage while loading (null otherwise). */
  stage: UploadStage | null;
  error: string | null;
  /** Resolves to the analysis on success, or null on failure. */
  upload: (file: File) => Promise<ContractAnalysis | null>;
  reset: () => void;
}

export function useContractUpload(): UseContractUpload {
  const [status, setStatus] = useState<Status>('idle');
  const [stage, setStage] = useState<UploadStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<ContractAnalysis | null> => {
    setStatus('loading');
    setError(null);
    setStage('uploading');

    let result: ContractAnalysis | null = null;
    let streamError: string | null = null;

    try {
      await uploadContractStream(file, (event) => {
        switch (event.stage) {
          case 'extracting':
          case 'analyzing':
            setStage(event.stage);
            break;
          case 'done':
            result = event.contract;
            setStage('done');
            break;
          case 'error':
            streamError = event.message;
            break;
        }
      });

      if (streamError) throw new Error(streamError);
      if (!result) throw new Error('No analysis result received');

      // Brief "Done" beat (bar at 100%) before the caller navigates to the report.
      await new Promise((resolve) => setTimeout(resolve, 650));
      return result;
    } catch (err) {
      setStatus('error');
      setStage(null);
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setStage(null);
    setError(null);
  }, []);

  return { status, stage, error, upload, reset };
}
