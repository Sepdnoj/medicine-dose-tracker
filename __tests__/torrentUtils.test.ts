import {
  formatBytes,
  formatSpeed,
  formatEta,
  calculateEta,
  formatProgress,
  isValidMagnetUri,
  extractInfoHash,
  extractDisplayName,
  getStatusLabel,
  getStatusColor,
  computeStats,
  createTorrentFromMagnet,
} from '../src/utils/torrentUtils';
import { Torrent } from '../src/models/torrentTypes';

// ─── formatBytes ──────────────────────────────────────────────────────────────

describe('formatBytes', () => {
  it('returns "0 B" for zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500.0 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB');
  });

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB');
  });

  it('respects decimal places', () => {
    expect(formatBytes(1536, 2)).toBe('1.50 KB');
  });
});

// ─── formatSpeed ──────────────────────────────────────────────────────────────

describe('formatSpeed', () => {
  it('formats speed with /s suffix', () => {
    expect(formatSpeed(1048576)).toBe('1.0 MB/s');
  });

  it('handles zero speed', () => {
    expect(formatSpeed(0)).toBe('0 B/s');
  });
});

// ─── formatEta ────────────────────────────────────────────────────────────────

describe('formatEta', () => {
  it('returns "--" for non-finite values', () => {
    expect(formatEta(Infinity)).toBe('--');
    expect(formatEta(0)).toBe('--');
    expect(formatEta(-1)).toBe('--');
  });

  it('formats seconds only', () => {
    expect(formatEta(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatEta(125)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatEta(3725)).toBe('1h 2m');
  });
});

// ─── calculateEta ─────────────────────────────────────────────────────────────

describe('calculateEta', () => {
  it('calculates ETA based on remaining bytes and speed', () => {
    const torrent = {
      totalSize: 1000,
      downloaded: 500,
      downloadSpeed: 100,
    } as Torrent;
    expect(calculateEta(torrent)).toBe(5);
  });

  it('returns Infinity when speed is 0', () => {
    const torrent = {
      totalSize: 1000,
      downloaded: 500,
      downloadSpeed: 0,
    } as Torrent;
    expect(calculateEta(torrent)).toBe(Infinity);
  });
});

// ─── formatProgress ───────────────────────────────────────────────────────────

describe('formatProgress', () => {
  it('formats 0 progress', () => {
    expect(formatProgress(0)).toBe('0.0%');
  });

  it('formats full progress', () => {
    expect(formatProgress(1)).toBe('100.0%');
  });

  it('formats partial progress', () => {
    expect(formatProgress(0.567)).toBe('56.7%');
  });
});

// ─── isValidMagnetUri ─────────────────────────────────────────────────────────

describe('isValidMagnetUri', () => {
  it('accepts valid magnet URIs', () => {
    expect(
      isValidMagnetUri('magnet:?xt=urn:btih:abc123def456abc123def456abc123def456abc1'),
    ).toBe(true);
  });

  it('rejects invalid URIs', () => {
    expect(isValidMagnetUri('https://example.com')).toBe(false);
    expect(isValidMagnetUri('')).toBe(false);
    expect(isValidMagnetUri('magnet:?xt=urn:sha1:abc')).toBe(false);
  });
});

// ─── extractInfoHash ──────────────────────────────────────────────────────────

describe('extractInfoHash', () => {
  it('extracts 40-char hex hash', () => {
    const hash = 'abc123def456abc123def456abc123def456abcd';
    expect(
      extractInfoHash(`magnet:?xt=urn:btih:${hash}&dn=test`),
    ).toBe(hash);
  });

  it('returns null for invalid URIs', () => {
    expect(extractInfoHash('not-a-magnet')).toBeNull();
  });
});

// ─── extractDisplayName ───────────────────────────────────────────────────────

describe('extractDisplayName', () => {
  it('extracts display name from dn parameter', () => {
    const hash = 'abc123def456abc123def456abc123def456abc123';
    expect(
      extractDisplayName(`magnet:?xt=urn:btih:${hash}&dn=My+Cool+File`),
    ).toBe('My Cool File');
  });

  it('falls back to truncated hash', () => {
    const hash = 'abc123def456abc123def456abc123def456abcd';
    expect(
      extractDisplayName(`magnet:?xt=urn:btih:${hash}`),
    ).toBe('abc123de...');
  });

  it('returns "Unknown Torrent" for invalid URIs', () => {
    expect(extractDisplayName('not-a-magnet')).toBe('Unknown Torrent');
  });
});

// ─── getStatusLabel / getStatusColor ──────────────────────────────────────────

describe('getStatusLabel', () => {
  it('returns labels for all statuses', () => {
    expect(getStatusLabel('downloading')).toBe('Downloading');
    expect(getStatusLabel('seeding')).toBe('Seeding');
    expect(getStatusLabel('paused')).toBe('Paused');
    expect(getStatusLabel('completed')).toBe('Completed');
    expect(getStatusLabel('queued')).toBe('Queued');
    expect(getStatusLabel('error')).toBe('Error');
  });
});

describe('getStatusColor', () => {
  it('returns colors for all statuses', () => {
    expect(getStatusColor('downloading')).toBe('#2196F3');
    expect(getStatusColor('error')).toBe('#F44336');
  });
});

// ─── computeStats ─────────────────────────────────────────────────────────────

describe('computeStats', () => {
  it('computes aggregate stats', () => {
    const torrents = [
      { downloaded: 100, uploaded: 50, status: 'downloading' },
      { downloaded: 200, uploaded: 100, status: 'completed' },
      { downloaded: 300, uploaded: 150, status: 'seeding' },
    ] as Torrent[];

    const stats = computeStats(torrents);
    expect(stats.totalDownloaded).toBe(600);
    expect(stats.totalUploaded).toBe(300);
    expect(stats.activeTorrents).toBe(2); // downloading + seeding
    expect(stats.totalTorrents).toBe(3);
  });

  it('handles empty list', () => {
    const stats = computeStats([]);
    expect(stats.totalDownloaded).toBe(0);
    expect(stats.activeTorrents).toBe(0);
  });
});

// ─── createTorrentFromMagnet ──────────────────────────────────────────────────

describe('createTorrentFromMagnet', () => {
  it('creates a torrent object from magnet URI', () => {
    const hash = 'abc123def456abc123def456abc123def456abc123';
    const magnet = `magnet:?xt=urn:btih:${hash}&dn=Test+File`;
    const torrent = createTorrentFromMagnet('test-id', magnet);

    expect(torrent.id).toBe('test-id');
    expect(torrent.name).toBe('Test File');
    expect(torrent.magnetUri).toBe(magnet);
    expect(torrent.status).toBe('queued');
    expect(torrent.progress).toBe(0);
    expect(torrent.files).toEqual([]);
    expect(torrent.error).toBeNull();
    expect(torrent.completedAt).toBeNull();
  });
});
