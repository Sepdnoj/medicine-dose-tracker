import { addHours, subHours, parseISO } from 'date-fns';
import { Dose, DoseStatus, Medicine } from '../models/types';

/** Filter doses within the rolling 24-hour window ending at `now`. */
export function getDosesInWindow(doses: Dose[], medicineId: string, now: Date): Dose[] {
  const windowStart = subHours(now, 24);
  return doses.filter((d) => {
    if (d.medicineId !== medicineId) return false;
    const ts = parseISO(d.timestamp);
    return ts >= windowStart && ts <= now;
  });
}

/** How many more doses can be given within the current 24-hour window. */
export function getRemaining(medicine: Medicine, dosesInWindow: Dose[]): number {
  return Math.max(0, medicine.maxIn24Hours - dosesInWindow.length);
}

/** Most recent dose for the medicine at or before `now`. */
export function getLastDose(doses: Dose[], medicineId: string, now: Date): Dose | null {
  const eligible = doses
    .filter((d) => {
      if (d.medicineId !== medicineId) return false;
      return parseISO(d.timestamp) <= now;
    })
    .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  return eligible[0] ?? null;
}

/** Earliest time the next dose is allowed based on minGapHours. */
export function getNextEligible(lastDose: Dose, medicine: Medicine): Date {
  return addHours(parseISO(lastDose.timestamp), medicine.minGapHours);
}

/** Whether a dose can be given right now. */
export function canGiveNow(
  medicine: Medicine,
  dosesInWindow: Dose[],
  lastDose: Dose | null,
  now: Date,
): boolean {
  if (getRemaining(medicine, dosesInWindow) <= 0) return false;
  if (!lastDose) return true;
  return getNextEligible(lastDose, medicine) <= now;
}

/**
 * When the 24-hour window will free up a slot — only relevant when the window
 * is completely full. Returns null if there's still capacity.
 */
export function getFreesUpAt(dosesInWindow: Dose[], medicine: Medicine): Date | null {
  if (dosesInWindow.length < medicine.maxIn24Hours) return null;
  // Earliest dose in the window — once it falls out, a slot opens
  const sorted = [...dosesInWindow].sort(
    (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime(),
  );
  return addHours(parseISO(sorted[0].timestamp), 24);
}

/** Compute the full DoseStatus for a medicine at a given point in time. */
export function getDoseStatus(doses: Dose[], medicine: Medicine, now: Date): DoseStatus {
  const dosesInWindow = getDosesInWindow(doses, medicine.id, now);
  const remaining = getRemaining(medicine, dosesInWindow);
  const lastDose = getLastDose(doses, medicine.id, now);
  const nextEligible = lastDose ? getNextEligible(lastDose, medicine) : null;
  const freesUpAt = getFreesUpAt(dosesInWindow, medicine);

  return {
    dosesInWindow,
    remaining,
    lastDose,
    nextEligible,
    canGiveNow: canGiveNow(medicine, dosesInWindow, lastDose, now),
    freesUpAt,
  };
}
