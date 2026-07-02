import { describe, it, expect } from 'vitest';
import { buildSegments } from './highlightClauses';
import type { RiskyClause } from '../types';

const clause = (
  text: string,
  severity: RiskyClause['severity'] = 'high',
  reason = 'reason',
): RiskyClause => ({ text, severity, reason });

describe('buildSegments', () => {
  it('returns the whole text as one plain segment when there are no clauses', () => {
    expect(buildSegments('Hello world', [])).toEqual([{ text: 'Hello world' }]);
  });

  it('marks a found clause and keeps the surrounding text (lossless)', () => {
    const text = 'A. Safe part. B. Risky clause here. C. End.';
    const segs = buildSegments(text, [clause('Risky clause here.', 'high', 'why')]);

    const marked = segs.filter((s) => s.severity);
    expect(marked).toHaveLength(1);
    expect(marked[0]).toMatchObject({
      text: 'Risky clause here.',
      severity: 'high',
      reason: 'why',
    });
    // reassembling the segments must reproduce the original text exactly
    expect(segs.map((s) => s.text).join('')).toBe(text);
  });

  it('skips a clause whose quote is not found verbatim', () => {
    expect(buildSegments('Only this text.', [clause('missing quote')])).toEqual([
      { text: 'Only this text.' },
    ]);
  });

  it('skips a clause that overlaps an earlier match', () => {
    const text = 'alpha beta gamma';
    const segs = buildSegments(text, [clause('alpha beta', 'high'), clause('beta gamma', 'low')]);

    const marked = segs.filter((s) => s.severity);
    expect(marked).toHaveLength(1);
    expect(marked[0].text).toBe('alpha beta');
    expect(segs.map((s) => s.text).join('')).toBe(text);
  });
});
