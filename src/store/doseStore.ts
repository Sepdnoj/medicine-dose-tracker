import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Dose } from '../models/types';

const STORAGE_KEY = 'medicine_doses';

interface DoseStore {
  doses: Dose[];
  currentTime: Date;
  isLive: boolean;

  // Actions
  addDose: (medicineId: string, timestamp?: string) => Promise<void>;
  deleteDose: (id: string) => Promise<void>;
  setCurrentTime: (time: Date) => void;
  toggleLive: () => void;
  loadDoses: () => Promise<void>;
}

async function persistDoses(doses: Dose[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(doses));
  } catch {
    // Silently fail — UI still works in memory
  }
}

export const useDoseStore = create<DoseStore>((set, get) => ({
  doses: [],
  currentTime: new Date(),
  isLive: true,

  addDose: async (medicineId, timestamp) => {
    const id = await Crypto.randomUUID();
    const newDose: Dose = {
      id,
      medicineId,
      timestamp: timestamp ?? new Date().toISOString(),
    };
    const doses = [...get().doses, newDose];
    set({ doses });
    await persistDoses(doses);
  },

  deleteDose: async (id) => {
    const doses = get().doses.filter((d) => d.id !== id);
    set({ doses });
    await persistDoses(doses);
  },

  setCurrentTime: (time) => set({ currentTime: time }),

  toggleLive: () => {
    const next = !get().isLive;
    set({ isLive: next });
    if (next) set({ currentTime: new Date() });
  },

  loadDoses: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const doses: Dose[] = JSON.parse(raw);
        set({ doses });
      }
    } catch {
      // Start fresh if storage is corrupt
    }
  },
}));
