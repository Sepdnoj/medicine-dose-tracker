/**
 * Torrent Engine Service
 *
 * Provides the bridge between the UI/store and the actual torrent protocol.
 * Uses a simulation layer for React Native environments where WebTorrent
 * cannot run natively. In a production setup, this would connect to a
 * backend torrent daemon (e.g., Transmission, qBittorrent) via their API,
 * or use WebTorrent on web targets.
 */
import { Torrent, TorrentFile } from '../models/torrentTypes';
import { useTorrentStore } from '../store/torrentStore';

type UpdateCallback = (
  id: string,
  update: Partial<Torrent>,
) => void;

interface TorrentEngine {
  start: (torrent: Torrent, onUpdate: UpdateCallback) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  remove: (id: string) => void;
  destroy: () => void;
}

// Active download simulation intervals
const activeIntervals = new Map<string, ReturnType<typeof setInterval>>();

function simulateFiles(name: string, totalSize: number): TorrentFile[] {
  // Generate realistic-looking file list
  const ext = name.includes('.') ? '' : '.mkv';
  return [
    {
      name: `${name}${ext}`,
      size: totalSize,
      downloaded: 0,
      progress: 0,
    },
  ];
}

function createSimulatedEngine(): TorrentEngine {
  return {
    start(torrent, onUpdate) {
      const totalSize = Math.floor(Math.random() * 2_000_000_000) + 100_000_000; // 100MB–2GB
      const files = simulateFiles(torrent.name, totalSize);
      let downloaded = 0;
      let uploaded = 0;

      onUpdate(torrent.id, {
        status: 'downloading',
        totalSize,
        files,
      });

      const interval = setInterval(() => {
        // Simulate download progress
        const speed = Math.floor(Math.random() * 5_000_000) + 500_000; // 0.5–5 MB/s
        const uploadSpeed = Math.floor(Math.random() * 1_000_000);
        downloaded = Math.min(downloaded + speed, totalSize);
        uploaded += uploadSpeed;
        const progress = downloaded / totalSize;
        const peers = Math.floor(Math.random() * 30) + 1;
        const seeds = Math.floor(Math.random() * 50) + 1;

        const updatedFiles = files.map((f) => ({
          ...f,
          downloaded: Math.floor(f.size * progress),
          progress,
        }));

        if (progress >= 1) {
          clearInterval(interval);
          activeIntervals.delete(torrent.id);
          onUpdate(torrent.id, {
            status: 'completed',
            progress: 1,
            downloaded: totalSize,
            uploaded,
            downloadSpeed: 0,
            uploadSpeed: 0,
            peers: 0,
            seeds,
            files: updatedFiles,
            completedAt: new Date().toISOString(),
          });
          return;
        }

        onUpdate(torrent.id, {
          progress,
          downloaded,
          uploaded,
          downloadSpeed: speed,
          uploadSpeed,
          peers,
          seeds,
          files: updatedFiles,
        });
      }, 1000);

      activeIntervals.set(torrent.id, interval);
    },

    pause(id) {
      const interval = activeIntervals.get(id);
      if (interval) {
        clearInterval(interval);
        activeIntervals.delete(id);
      }
    },

    resume(id) {
      // Re-start with current state via the store
      const torrent = useTorrentStore.getState().torrents.find((t) => t.id === id);
      if (torrent) {
        this.start(torrent, (tid, update) => {
          useTorrentStore.getState().updateTorrentProgress(tid, update);
        });
      }
    },

    remove(id) {
      this.pause(id);
    },

    destroy() {
      for (const [id, interval] of activeIntervals) {
        clearInterval(interval);
      }
      activeIntervals.clear();
    },
  };
}

// Singleton engine instance
let engineInstance: TorrentEngine | null = null;

export function getTorrentEngine(): TorrentEngine {
  if (!engineInstance) {
    engineInstance = createSimulatedEngine();
  }
  return engineInstance;
}

/** Start downloading a torrent and wire updates to the store */
export function startTorrentDownload(torrent: Torrent): void {
  const engine = getTorrentEngine();
  engine.start(torrent, (id, update) => {
    useTorrentStore.getState().updateTorrentProgress(id, update);
  });
}

/** Pause a torrent download */
export function pauseTorrentDownload(id: string): void {
  getTorrentEngine().pause(id);
}

/** Resume a torrent download */
export function resumeTorrentDownload(id: string): void {
  getTorrentEngine().resume(id);
}

/** Remove a torrent from the engine */
export function removeTorrentFromEngine(id: string): void {
  getTorrentEngine().remove(id);
}
