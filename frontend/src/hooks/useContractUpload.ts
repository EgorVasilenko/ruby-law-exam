import { useCallback, useState } from 'react';
import { uploadContract } from '../api/contracts';
import type { ContractAnalysis } from '../types';

type Status = 'idle' | 'loading' | 'error';

interface UseContractUpload {
  status: Status;
  error: string | null;
  /** Resolves to the analysis on success, or null on failure. */
  upload: (file: File) => Promise<ContractAnalysis | null>;
  reset: () => void;
}

export function useContractUpload(): UseContractUpload {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<ContractAnalysis | null> => {
    setStatus('loading');
    setError(null);
    try {
      const result = await uploadContract(file);
      setStatus('idle');
      return result;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { status, error, upload, reset };
}
