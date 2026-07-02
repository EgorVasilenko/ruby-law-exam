import { API_BASE_URL } from '../config';
import type { ContractAnalysis, ProgressEvent } from '../types';

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

/** Splits accumulated SSE text into complete parsed events + the leftover partial frame. */
export function parseSseEvents(buffer: string): { events: ProgressEvent[]; rest: string } {
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() ?? '';
  const events: ProgressEvent[] = [];
  for (const block of blocks) {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice('data:'.length).trim())
      .join('');
    if (data) events.push(JSON.parse(data) as ProgressEvent);
  }
  return { events, rest };
}

/** Uploads a contract and streams analysis progress via SSE (over fetch). */
export async function uploadContractStream(
  file: File,
  onEvent: (event: ProgressEvent) => void,
): Promise<void> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/contracts/upload/stream`, {
    method: 'POST',
    body: form,
  });

  // Errors before the stream opens (400/413/429) arrive as a JSON envelope.
  if (!res.ok) {
    await unwrap<unknown>(res); // always throws ApiError for a non-2xx status
  }
  if (!res.body) {
    throw new ApiError('Streaming is not supported by this browser', res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseSseEvents(buffer);
    buffer = rest;
    for (const event of events) onEvent(event);
  }
}
