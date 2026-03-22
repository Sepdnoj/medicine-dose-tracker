import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TorrentStats as Stats } from '../models/torrentTypes';
import { formatBytes } from '../utils/torrentUtils';
import { Colors, Spacing, Typography, Radius } from '../theme/tokens';

interface TorrentStatsProps {
  stats: Stats;
}

export function TorrentStatsBar({ stats }: TorrentStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stat}>
        <Text style={styles.value}>{stats.activeTorrents}</Text>
        <Text style={styles.label}>Active</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.value}>{stats.totalTorrents}</Text>
        <Text style={styles.label}>Total</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.value}>{formatBytes(stats.totalDownloaded)}</Text>
        <Text style={styles.label}>Downloaded</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.value}>{formatBytes(stats.totalUploaded)}</Text>
        <Text style={styles.label}>Uploaded</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.darkText,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    color: Colors.lightGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
});
