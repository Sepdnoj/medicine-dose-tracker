import { Torrent, TorrentStatus, TorrentStats } from '../models/torrentTypes';

/** Format bytes to human-readable string */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(decimals)} ${sizes[i]}`;
}

/** Format bytes/sec to human-readable speed */
export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`;
}

/** Format seconds to human-readable ETA */
export function formatEta(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Calculate ETA in seconds based on remaining bytes and speed */
export function calculateEta(torrent: Torrent): number {
  if (torrent.downloadSpeed <= 0) return Infinity;
  const remaining = torrent.totalSize - torrent.downloaded;
  return remaining / torrent.downloadSpeed;
}

/** Format progress as percentage string */
export function formatProgress(progress: number): string {
  return `${(progress * 100).toFixed(1)}%`;
}

/** Validate a magnet URI */
export function isValidMagnetUri(uri: string): boolean {
  return uri.startsWith('magnet:?xt=urn:btih:');
}

/** Extract info hash from magnet URI */
export function extractInfoHash(magnetUri: string): string | null {
  const match = magnetUri.match(/xt=urn:btih:([a-fA-F0-9]{40}|[a-zA-Z2-7]{32})/);
  return match ? match[1].toLowerCase() : null;
}

/** Extract display name from magnet URI */
export function extractDisplayName(magnetUri: string): string {
  const match = magnetUri.match(/dn=([^&]+)/);
  if (match) return decodeURIComponent(match[1].replace(/\+/g, ' '));
  const hash = extractInfoHash(magnetUri);
  return hash ? hash.substring(0, 8) + '...' : 'Unknown Torrent';
}

/** Get status display label */
export function getStatusLabel(status: TorrentStatus): string {
  const labels: Record<TorrentStatus, string> = {
    queued: 'Queued',
    downloading: 'Downloading',
    seeding: 'Seeding',
    paused: 'Paused',
    completed: 'Completed',
    error: 'Error',
  };
  return labels[status];
}

/** Get status color */
export function getStatusColor(status: TorrentStatus): string {
  const colors: Record<TorrentStatus, string> = {
    queued: '#9E9E9E',
    downloading: '#2196F3',
    seeding: '#4CAF50',
    paused: '#FF9800',
    completed: '#4CAF50',
    error: '#F44336',
  };
  return colors[status];
}

/** Compute aggregate stats from torrent list */
export function computeStats(torrents: Torrent[]): TorrentStats {
  return {
    totalDownloaded: torrents.reduce((sum, t) => sum + t.downloaded, 0),
    totalUploaded: torrents.reduce((sum, t) => sum + t.uploaded, 0),
    activeTorrents: torrents.filter(
      (t) => t.status === 'downloading' || t.status === 'seeding',
    ).length,
    totalTorrents: torrents.length,
  };
}

/** Create an empty torrent object from a magnet URI */
export function createTorrentFromMagnet(
  id: string,
  magnetUri: string,
): Torrent {
  return {
    id,
    name: extractDisplayName(magnetUri),
    magnetUri,
    status: 'queued',
    progress: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    downloaded: 0,
    uploaded: 0,
    totalSize: 0,
    peers: 0,
    seeds: 0,
    files: [],
    addedAt: new Date().toISOString(),
    completedAt: null,
    error: null,
  };
}
