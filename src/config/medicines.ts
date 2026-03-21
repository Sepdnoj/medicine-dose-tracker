import { Medicine } from '../models/types';

export const MEDICINES: Medicine[] = [
  {
    id: 'calpol',
    name: 'Calpol',
    colour: '#E05C6F',
    bgColour: '#FDE8EB',
    minGapHours: 4,
    maxIn24Hours: 4,
  },
  {
    id: 'nurofen',
    name: 'Nurofen',
    colour: '#3B7DD8',
    bgColour: '#E3EEFB',
    minGapHours: 6,
    maxIn24Hours: 3,
  },
];

export const getMedicine = (id: string): Medicine | undefined =>
  MEDICINES.find((m) => m.id === id);
