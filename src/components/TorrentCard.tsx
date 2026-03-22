import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Torrent } from '../models/torrentTypes';
import {
  formatBytes,
  formatSpeed,
  formatEta,
  formatProgress,
  calculateEta,
  getStatusLabel,
  getStatusColor,
} from '../utils/torrentUtils';
import { ProgressBar } from './ProgressBar';
import { Colors, Spacing, Typography, Radius } from '../theme/tokens';

interface TorrentCardProps {
  torrent: Torrent;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRemove: (id: string) => void;
}

export function TorrentCard({ torrent, onPause, onResume, onRemove }: TorrentCardProps) {
  const statusColor = getStatusColor(torrent.status);
  const isActive = torrent.status === 'downloading' || torrent.status === 'seeding';
  const isPaused = torrent.status === 'paused';
  const isCompleted = torrent.status === 'completed';

  const handleRemove = () => {
    Alert.alert(
      'Remove Torrent',
      `Remove "${torrent.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemove(torrent.id) },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Header: name + status badge */}
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>
          {torrent.name}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {getStatusLabel(torrent.status)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <ProgressBar progress={torrent.progress} color={statusColor} height={8} />
        <Text style={styles.progressText}>{formatProgress(torrent.progress)}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Size</Text>
          <Text style={styles.statValue}>
            {torrent.totalSize > 0
              ? `${formatBytes(torrent.downloaded)} / ${formatBytes(torrent.totalSize)}`
              : '—'}
          </Text>
        </View>
        {isActive && torrent.status === 'downloading' && (
          <>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Speed</Text>
              <Text style={styles.statValue}>{formatSpeed(torrent.downloadSpeed)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>ETA</Text>
              <Text style={styles.statValue}>{formatEta(calculateEta(torrent))}</Text>
            </View>
          </>
        )}
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Peers</Text>
          <Text style={styles.statValue}>{torrent.peers + torrent.seeds}</Text>
        </View>
      </View>

      {/* Upload stats for seeding */}
      {(torrent.status === 'seeding' || isCompleted) && torrent.uploaded > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Uploaded</Text>
            <Text style={styles.statValue}>{formatBytes(torrent.uploaded)}</Text>
          </View>
          {torrent.status === 'seeding' && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Upload Speed</Text>
              <Text style={styles.statValue}>{formatSpeed(torrent.uploadSpeed)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Error message */}
      {torrent.error && (
        <Text style={styles.errorText}>{torrent.error}</Text>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {isActive && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.pauseBtn]}
            onPress={() => onPause(torrent.id)}
          >
            <Text style={styles.actionBtnText}>Pause</Text>
          </TouchableOpacity>
        )}
        {(isPaused || torrent.status === 'queued' || torrent.status === 'error') && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.resumeBtn]}
            onPress={() => onResume(torrent.id)}
          >
            <Text style={styles.actionBtnText}>
              {torrent.status === 'queued' ? 'Start' : 'Resume'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.removeBtn]}
          onPress={handleRemove}
        >
          <Text style={[styles.actionBtnText, styles.removeBtnText]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.darkText,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.midGrey,
    minWidth: 45,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  stat: {
    gap: 2,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.lightGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.darkText,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: '#F44336',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  pauseBtn: {
    backgroundColor: '#FF980020',
  },
  resumeBtn: {
    backgroundColor: '#2196F320',
  },
  removeBtn: {
    backgroundColor: '#F4433610',
    marginLeft: 'auto',
  },
  actionBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.darkText,
  },
  removeBtnText: {
    color: '#F44336',
  },
});
