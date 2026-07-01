import type { RiskSeverity, RiskyClause } from '../types';

export interface Segment {
  text: string;
  /** Present when this segment is a flagged clause. */
  severity?: RiskSeverity;
  reason?: string;
}

/**
 * Splits `fullText` into plain and flagged segments by locating each risky
 * clause's exact quote. Overlapping matches are skipped; clauses whose quote
 * isn't found verbatim are simply not highlighted (they still appear in the
 * risk-flags list).
 */
export function buildSegments(fullText: string, clauses: RiskyClause[]): Segment[] {
  interface Range {
    start: number;
    end: number;
    severity: RiskSeverity;
    reason: string;
  }

  const ranges: Range[] = [];
  for (const clause of clauses) {
    if (!clause.text) continue;
    const start = fullText.indexOf(clause.text);
    if (start === -1) continue;
    ranges.push({ start, end: start + clause.text.length, severity: clause.severity, reason: clause.reason });
  }

  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue; // overlaps a previous match — skip
    if (range.start > cursor) segments.push({ text: fullText.slice(cursor, range.start) });
    segments.push({
      text: fullText.slice(range.start, range.end),
      severity: range.severity,
      reason: range.reason,
    });
    cursor = range.end;
  }
  if (cursor < fullText.length) segments.push({ text: fullText.slice(cursor) });

  return segments;
}
