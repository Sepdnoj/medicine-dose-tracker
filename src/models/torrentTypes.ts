export type TorrentStatus = 'queued' | 'downloading' | 'seeding' | 'paused' | 'completed' | 'error';

export interface TorrentFile {
  name: string;
  size: number;
  downloaded: number;
  progress: number;
}

export interface Torrent {
  id: string;
  name: string;
  magnetUri: string;
  status: TorrentStatus;
  progress: number; // 0–1
  downloadSpeed: number; // bytes/sec
  uploadSpeed: number; // bytes/sec
  downloaded: number; // bytes
  uploaded: number; // bytes
  totalSize: number; // bytes
  peers: number;
  seeds: number;
  files: TorrentFile[];
  addedAt: string; // ISO datetime
  completedAt: string | null;
  error: string | null;
}

export interface TorrentStats {
  totalDownloaded: number;
  totalUploaded: number;
  activeTorrents: number;
  totalTorrents: number;
}
