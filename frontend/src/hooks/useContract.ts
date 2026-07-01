import { useEffect, useState } from 'react';
import { getContract } from '../api/contracts';
import type { ContractAnalysis } from '../types';

type Status = 'loading' | 'error' | 'success';

interface UseContract {
  status: Status;
  data: ContractAnalysis | null;
  error: string | null;
}

/** Fetches a stored analysis by id (used for deep-links and refresh). */
export function useContract(id: string): UseContract {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    setData(null);

    getContract(id)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('success');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load contract');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { status, data, error };
}
