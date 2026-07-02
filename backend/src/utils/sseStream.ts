import type { Response } from 'express';

export interface SseStream {
  send(event: unknown): void;
  close(): void;
}

/**
 * Wraps an Express response as a Server-Sent Events stream. Encapsulates the
 * transport details (headers, framing) so controllers just call send()/close().
 * `X-Accel-Buffering: no` tells nginx not to buffer, so events arrive live
 * through the frontend proxy without a nginx.conf change.
 */
export function sseStream(res: Response): SseStream {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  return {
    send: (event: unknown) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    },
    close: () => {
      res.end();
    },
  };
}
