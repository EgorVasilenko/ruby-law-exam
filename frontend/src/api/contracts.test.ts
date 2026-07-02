import { describe, it, expect } from 'vitest';
import { parseSseEvents } from './contracts';

describe('parseSseEvents', () => {
  it('parses complete events and keeps the trailing partial frame', () => {
    const { events, rest } = parseSseEvents(
      'data: {"stage":"extracting"}\n\ndata: {"stage":"analyz',
    );
    expect(events).toEqual([{ stage: 'extracting' }]);
    expect(rest).toBe('data: {"stage":"analyz');
  });

  it('parses several events in one chunk', () => {
    const { events } = parseSseEvents(
      'data: {"stage":"extracting"}\n\ndata: {"stage":"analyzing"}\n\n',
    );
    expect(events).toEqual([{ stage: 'extracting' }, { stage: 'analyzing' }]);
  });

  it('returns no events when only a partial frame is buffered', () => {
    const { events, rest } = parseSseEvents('data: {"stage":');
    expect(events).toEqual([]);
    expect(rest).toBe('data: {"stage":');
  });
});
