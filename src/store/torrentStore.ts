import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Torrent, TorrentStatus } from '../models/torrentTypes';
import { createTorrentFromMagnet } from '../utils/torrentUtils';

const STORAGE_KEY = 'torrents';

interface TorrentStore {
  torrents: Torrent[];
  loaded: boolean;

  // Actions
  loadTorrents: () => Promise<void>;
  addTorrent: (magnetUri: string) => Promise<string>;
  removeTorrent: (id: string) => Promise<void>;
  pauseTorrent: (id: string) => Promise<void>;
  resumeTorrent: (id: string) => Promise<void>;
  updateTorrentProgress: (
    id: string,
    update: Partial<
      Pick<
        Torrent,
        | 'progress'
        | 'downloadSpeed'
        | 'uploadSpeed'
        | 'downloaded'
        | 'uploaded'
        | 'totalSize'
        | 'peers'
        | 'seeds'
        | 'status'
        | 'files'
        | 'name'
        | 'error'
        | 'completedAt'
      >
    >,
  ) => void;
  clearCompleted: () => Promise<void>;
}

async function persistTorrents(torrents: Torrent[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(torrents));
  } catch {
    // Silently fail — UI still works in memory
  }
}

export const useTorrentStore = create<TorrentStore>((set, get) => ({
  torrents: [],
  loaded: false,

  loadTorrents: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const torrents: Torrent[] = JSON.parse(raw);
        // Reset transient state on load
        const restored = torrents.map((t) => ({
          ...t,
          downloadSpeed: 0,
          uploadSpeed: 0,
          peers: 0,
          seeds: 0,
          status: (t.status === 'downloading' || t.status === 'queued'
            ? 'paused'
            : t.status) as TorrentStatus,
        }));
        set({ torrents: restored, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  addTorrent: async (magnetUri: string) => {
    const id = await Crypto.randomUUID();
    const torrent = createTorrentFromMagnet(id, magnetUri);
    const torrents = [torrent, ...get().torrents];
    set({ torrents });
    await persistTorrents(torrents);
    return id;
  },

  removeTorrent: async (id: string) => {
    const torrents = get().torrents.filter((t) => t.id !== id);
    set({ torrents });
    await persistTorrents(torrents);
  },

  pauseTorrent: async (id: string) => {
    const torrents = get().torrents.map((t) =>
      t.id === id
        ? { ...t, status: 'paused' as TorrentStatus, downloadSpeed: 0, uploadSpeed: 0 }
        : t,
    );
    set({ torrents });
    await persistTorrents(torrents);
  },

  resumeTorrent: async (id: string) => {
    const torrents = get().torrents.map((t) =>
      t.id === id
        ? { ...t, status: (t.progress >= 1 ? 'seeding' : 'downloading') as TorrentStatus }
        : t,
    );
    set({ torrents });
    await persistTorrents(torrents);
  },

  updateTorrentProgress: (id, update) => {
    const torrents = get().torrents.map((t) =>
      t.id === id ? { ...t, ...update } : t,
    );
    set({ torrents });
  },

  clearCompleted: async () => {
    const torrents = get().torrents.filter((t) => t.status !== 'completed');
    set({ torrents });
    await persistTorrents(torrents);
  },
}));
