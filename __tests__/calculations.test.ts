import { addHours, subHours } from 'date-fns';
import {
  getDosesInWindow,
  getRemaining,
  getLastDose,
  getNextEligible,
  canGiveNow,
  getFreesUpAt,
  getDoseStatus,
} from '../src/utils/calculations';
import { Dose, Medicine } from '../src/models/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const calpol: Medicine = {
  id: 'calpol',
  name: 'Calpol',
  colour: '#E05C6F',
  bgColour: '#FDE8EB',
  minGapHours: 4,
  maxIn24Hours: 4,
};

const nurofen: Medicine = {
  id: 'nurofen',
  name: 'Nurofen',
  colour: '#3B7DD8',
  bgColour: '#E3EEFB',
  minGapHours: 6,
  maxIn24Hours: 3,
};

const NOW = new Date('2026-01-15T12:00:00.000Z');

function makeDose(medicineId: string, hoursAgo: number, id = `dose-${hoursAgo}`): Dose {
  return {
    id,
    medicineId,
    timestamp: subHours(NOW, hoursAgo).toISOString(),
  };
}

// ─── getDosesInWindow ─────────────────────────────────────────────────────────

describe('getDosesInWindow', () => {
  it('returns only doses within the 24-hour window', () => {
    const doses: Dose[] = [
      makeDose('calpol', 1),   // 1h ago — in window
      makeDose('calpol', 12),  // 12h ago — in window
      makeDose('calpol', 23),  // 23h ago — in window
      makeDose('calpol', 25),  // 25h ago — outside window
    ];
    const result = getDosesInWindow(doses, 'calpol', NOW);
    expect(result).toHaveLength(3);
    expect(result.map((d) => d.id)).not.toContain('dose-25');
  });

  it('filters by medicineId', () => {
    const doses: Dose[] = [
      makeDose('calpol', 2),
      makeDose('nurofen', 2, 'nurofen-2'),
    ];
    expect(getDosesInWindow(doses, 'calpol', NOW)).toHaveLength(1);
    expect(getDosesInWindow(doses, 'nurofen', NOW)).toHaveLength(1);
  });

  it('includes a dose exactly at the 24-hour boundary', () => {
    const doses: Dose[] = [makeDose('calpol', 24)];
    const result = getDosesInWindow(doses, 'calpol', NOW);
    expect(result).toHaveLength(1);
  });

  it('excludes a dose one second beyond the 24-hour boundary', () => {
    const doses: Dose[] = [
      {
        id: 'just-outside',
        medicineId: 'calpol',
        timestamp: new Date(subHours(NOW, 24).getTime() - 1000).toISOString(),
      },
    ];
    expect(getDosesInWindow(doses, 'calpol', NOW)).toHaveLength(0);
  });

  it('returns empty array when no doses exist', () => {
    expect(getDosesInWindow([], 'calpol', NOW)).toHaveLength(0);
  });

  it('excludes future doses', () => {
    const futureDose: Dose = {
      id: 'future',
      medicineId: 'calpol',
      timestamp: addHours(NOW, 1).toISOString(),
    };
    expect(getDosesInWindow([futureDose], 'calpol', NOW)).toHaveLength(0);
  });
});

// ─── getRemaining ─────────────────────────────────────────────────────────────

describe('getRemaining', () => {
  it('returns maxIn24Hours when no doses given', () => {
    expect(getRemaining(calpol, [])).toBe(4);
  });

  it('reduces remaining by doses in window', () => {
    const inWindow = [makeDose('calpol', 1), makeDose('calpol', 5)];
    expect(getRemaining(calpol, inWindow)).toBe(2);
  });

  it('returns 0 when max is reached', () => {
    const inWindow = [
      makeDose('calpol', 1),
      makeDose('calpol', 5),
      makeDose('calpol', 9),
      makeDose('calpol', 13),
    ];
    expect(getRemaining(calpol, inWindow)).toBe(0);
  });

  it('never returns negative', () => {
    const tooMany = Array.from({ length: 6 }, (_, i) => makeDose('calpol', i + 1, `d${i}`));
    expect(getRemaining(calpol, tooMany)).toBe(0);
  });
});

// ─── getLastDose ──────────────────────────────────────────────────────────────

describe('getLastDose', () => {
  it('returns the most recent dose at or before now', () => {
    const doses = [makeDose('calpol', 2), makeDose('calpol', 6)];
    const last = getLastDose(doses, 'calpol', NOW);
    expect(last?.id).toBe('dose-2');
  });

  it('returns null when no doses exist', () => {
    expect(getLastDose([], 'calpol', NOW)).toBeNull();
  });

  it('ignores future doses', () => {
    const futureDose: Dose = {
      id: 'future',
      medicineId: 'calpol',
      timestamp: addHours(NOW, 1).toISOString(),
    };
    expect(getLastDose([futureDose], 'calpol', NOW)).toBeNull();
  });

  it('ignores doses for other medicines', () => {
    const doses = [makeDose('nurofen', 2, 'nurofen-2')];
    expect(getLastDose(doses, 'calpol', NOW)).toBeNull();
  });
});

// ─── getNextEligible ──────────────────────────────────────────────────────────

describe('getNextEligible', () => {
  it('returns lastDose time + minGapHours for Calpol', () => {
    const last = makeDose('calpol', 2);
    const result = getNextEligible(last, calpol);
    const expected = addHours(new Date(last.timestamp), calpol.minGapHours);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('returns lastDose time + minGapHours for Nurofen', () => {
    const last = makeDose('nurofen', 3, 'n3');
    const result = getNextEligible(last, nurofen);
    const expected = addHours(new Date(last.timestamp), nurofen.minGapHours);
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('computes correctly for a dose exactly at the gap boundary', () => {
    const last = makeDose('calpol', 4); // exactly 4h ago = eligible right now
    const result = getNextEligible(last, calpol);
    expect(result.getTime()).toBe(NOW.getTime());
  });
});

// ─── canGiveNow ───────────────────────────────────────────────────────────────

describe('canGiveNow', () => {
  it('returns true when no doses given yet', () => {
    expect(canGiveNow(calpol, [], null, NOW)).toBe(true);
  });

  it('returns true when gap has elapsed and slots remain', () => {
    const lastDose = makeDose('calpol', 5); // 5h ago; gap is 4h — OK
    expect(canGiveNow(calpol, [lastDose], lastDose, NOW)).toBe(true);
  });

  it('returns false when within the minimum gap', () => {
    const lastDose = makeDose('calpol', 2); // 2h ago; gap is 4h — not yet
    expect(canGiveNow(calpol, [lastDose], lastDose, NOW)).toBe(false);
  });

  it('returns false when max doses reached', () => {
    const inWindow = Array.from({ length: 4 }, (_, i) =>
      makeDose('calpol', (i + 1) * 5, `d${i}`),
    );
    const lastDose = inWindow[0]; // most recent, 5h ago — gap OK
    expect(canGiveNow(calpol, inWindow, lastDose, NOW)).toBe(false);
  });

  it('returns true exactly at the gap boundary', () => {
    const lastDose = makeDose('calpol', 4); // exactly 4h ago = exactly eligible
    expect(canGiveNow(calpol, [lastDose], lastDose, NOW)).toBe(true);
  });
});

// ─── getFreesUpAt ─────────────────────────────────────────────────────────────

describe('getFreesUpAt', () => {
  it('returns null when window is not full', () => {
    const inWindow = [makeDose('calpol', 1), makeDose('calpol', 5)];
    expect(getFreesUpAt(inWindow, calpol)).toBeNull();
  });

  it('returns earliest dose + 24h when window is full', () => {
    const inWindow = [
      makeDose('calpol', 1),
      makeDose('calpol', 5),
      makeDose('calpol', 10),
      makeDose('calpol', 15), // earliest
    ];
    const result = getFreesUpAt(inWindow, calpol);
    const expectedBase = subHours(NOW, 15);
    expect(result?.getTime()).toBe(addHours(expectedBase, 24).getTime());
  });

  it('returns null for empty array', () => {
    expect(getFreesUpAt([], calpol)).toBeNull();
  });
});

// ─── getDoseStatus (integration) ─────────────────────────────────────────────

describe('getDoseStatus', () => {
  it('returns correct status with no doses', () => {
    const status = getDoseStatus([], calpol, NOW);
    expect(status.dosesInWindow).toHaveLength(0);
    expect(status.remaining).toBe(4);
    expect(status.lastDose).toBeNull();
    expect(status.nextEligible).toBeNull();
    expect(status.canGiveNow).toBe(true);
    expect(status.freesUpAt).toBeNull();
  });

  it('returns correct status with doses in window', () => {
    const doses = [makeDose('calpol', 2), makeDose('calpol', 8)];
    const status = getDoseStatus(doses, calpol, NOW);
    expect(status.dosesInWindow).toHaveLength(2);
    expect(status.remaining).toBe(2);
    expect(status.canGiveNow).toBe(false); // last dose 2h ago, gap is 4h
  });

  it('returns freesUpAt when window is full', () => {
    const doses = [
      makeDose('calpol', 2),
      makeDose('calpol', 6),
      makeDose('calpol', 10),
      makeDose('calpol', 14),
    ];
    const status = getDoseStatus(doses, calpol, NOW);
    expect(status.remaining).toBe(0);
    expect(status.freesUpAt).not.toBeNull();
    expect(status.canGiveNow).toBe(false);
  });

  it('handles doses outside window correctly', () => {
    const doses = [
      makeDose('calpol', 26), // outside 24h window
    ];
    const status = getDoseStatus(doses, calpol, NOW);
    expect(status.dosesInWindow).toHaveLength(0);
    expect(status.remaining).toBe(4);
    // lastDose is null because the dose is > 24h ago, but getLastDose looks at all doses <= now
    expect(status.lastDose).not.toBeNull(); // it was still given, just outside window
  });
});
