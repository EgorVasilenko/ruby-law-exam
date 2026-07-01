import { API_BASE_URL } from '../config';
import type { ContractAnalysis } from '../types';

/** Error carrying the backend's status code and error code, if any. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface SuccessEnvelope<T> {
  data: T;
}

interface ErrorEnvelope {
  error: { code: string; message: string };
}

async function unwrap<T>(res: Response): Promise<T> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }

  if (!res.ok) {
    const err = (body as ErrorEnvelope | undefined)?.error;
    throw new ApiError(err?.message ?? 'Request failed', res.status, err?.code);
  }

  return (body as SuccessEnvelope<T>).data;
}

export async function uploadContract(file: File): Promise<ContractAnalysis> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/contracts/upload`, {
    method: 'POST',
    body: form,
  });
  return unwrap<ContractAnalysis>(res);
}

export async function getContract(id: string): Promise<ContractAnalysis> {
  const res = await fetch(`${API_BASE_URL}/api/contracts/${encodeURIComponent(id)}`);
  return unwrap<ContractAnalysis>(res);
}
