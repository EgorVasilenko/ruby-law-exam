import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from './app';
import { ContractService } from './services/contractService';
import { ContractStore } from './services/contractStore';
import type { Config } from './config';
import type { ContractAIResult } from './types';

const ANALYSIS: ContractAIResult = {
  type: 'Service Agreement',
  riskScore: 75,
  missingClauses: ['Governing law'],
  recommendations: ['Add a liability cap'],
  riskyClauses: [{ text: 'unlimited liability', severity: 'high', reason: 'exposes the client' }],
};

const config: Config = {
  server: { port: 0, frontendUrl: 'http://localhost:5173' },
  upload: { maxMb: 10, maxBytes: 10 * 1024 * 1024 },
  rateLimit: { max: 1000, windowMs: 60_000 }, // high so tests never hit the limiter
  ai: { apiKey: 'test', model: 'test', temperature: 0, maxInputChars: 1000, systemPrompt: '' },
};

/** App wired with a real service/store but faked AI + extractor (no OpenAI, no parsing). */
function buildApp(): Express {
  const service = new ContractService(
    new ContractStore(),
    async () => ANALYSIS,
    async () => 'extracted contract text',
  );
  return createApp({ config, contractService: service });
}

describe('HTTP API (integration)', () => {
  let app: Express;
  beforeEach(() => {
    app = buildApp();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /api/contracts/upload analyses a file (201)', async () => {
    const res = await request(app)
      .post('/api/contracts/upload')
      .attach('file', Buffer.from('%PDF-fake'), {
        filename: 'contract.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ type: 'Service Agreement', riskScore: 75 });
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.riskyClauses).toHaveLength(1);
  });

  it('rejects a missing file with 400', async () => {
    const res = await request(app).post('/api/contracts/upload');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an unsupported file type with 400', async () => {
    const res = await request(app)
      .post('/api/contracts/upload')
      .attach('file', Buffer.from('hello'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('serves a stored analysis by id, and 404s for unknown ids', async () => {
    const upload = await request(app)
      .post('/api/contracts/upload')
      .attach('file', Buffer.from('%PDF-fake'), {
        filename: 'contract.pdf',
        contentType: 'application/pdf',
      });
    const { id } = upload.body.data as { id: string };

    const found = await request(app).get(`/api/contracts/${id}`);
    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(id);

    const missing = await request(app).get('/api/contracts/does-not-exist');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });
});
