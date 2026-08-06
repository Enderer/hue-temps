import { describe, it, expect } from 'vitest';
import { calendarDate } from './calendar-date';

describe('calendarDate', () => {
  it('throws for invalid year', () => {
    expect(() => calendarDate(-1, 1, 1)).toThrow('Invalid date');
    expect(() => calendarDate(3000, 1, 1)).toThrow('Invalid date');
  });

  it('throws for invalid month', () => {
    expect(() => calendarDate(2026, 0, 1)).toThrow('Invalid date');
    expect(() => calendarDate(2026, 13, 1)).toThrow('Invalid date');
  });

  it('throws for invalid day', () => {
    expect(() => calendarDate(2026, 1, 0)).toThrow('Invalid date');
    expect(() => calendarDate(2026, 1, 32)).toThrow('Invalid date');
  });

  it('throws for invalid hour', () => {
    expect(() => calendarDate(2026, 1, 1, -1, 0)).toThrow('Invalid time');
    expect(() => calendarDate(2026, 1, 1, 25, 0)).toThrow('Invalid time');
  });

  it('throws for invalid minute', () => {
    expect(() => calendarDate(2026, 1, 1, 0, -1)).toThrow('Invalid time');
    expect(() => calendarDate(2026, 1, 1, 23, 61)).toThrow('Invalid time');
  });
});
