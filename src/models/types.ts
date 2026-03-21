export interface Medicine {
  id: string;
  name: string;
  colour: string;
  bgColour: string;
  minGapHours: number;
  maxIn24Hours: number;
}

export interface Dose {
  id: string;
  medicineId: string;
  timestamp: string; // ISO datetime
}

export interface DoseStatus {
  dosesInWindow: Dose[];
  remaining: number;
  lastDose: Dose | null;
  nextEligible: Date | null;
  canGiveNow: boolean;
  freesUpAt: Date | null;
}
