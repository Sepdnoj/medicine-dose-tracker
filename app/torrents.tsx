import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useTorrentStore } from '../src/store/torrentStore';
import { TorrentCard } from '../src/components/TorrentCard';
import { TorrentStatsBar } from '../src/components/TorrentStats';
import { AddTorrentModal } from '../src/components/AddTorrentModal';
import { computeStats } from '../src/utils/torrentUtils';
import {
  startTorrentDownload,
  pauseTorrentDownload,
  resumeTorrentDownload,
  removeTorrentFromEngine,
} from '../src/services/torrentEngine';
import { Colors, Spacing, Typography, Radius } from '../src/theme/tokens';

export default function TorrentsScreen() {
  const {
    torrents,
    loaded,
    loadTorrents,
    addTorrent,
    removeTorrent,
    pauseTorrent,
    resumeTorrent,
    clearCompleted,
  } = useTorrentStore();

  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadTorrents();
  }, []);

  const stats = computeStats(torrents);

  const handleAdd = async (magnetUri: string) => {
    const id = await addTorrent(magnetUri);
    const torrent = useTorrentStore.getState().torrents.find((t) => t.id === id);
    if (torrent) {
      startTorrentDownload(torrent);
    }
  };

  const handlePause = (id: string) => {
    pauseTorrentDownload(id);
    pauseTorrent(id);
  };

  const handleResume = (id: string) => {
    resumeTorrent(id);
    resumeTorrentDownload(id);
  };

  const handleRemove = (id: string) => {
    removeTorrentFromEngine(id);
    removeTorrent(id);
  };

  const hasCompleted = torrents.some((t) => t.status === 'completed');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Torrents</Text>
            <Text style={styles.subtitle}>Download manager</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        {torrents.length > 0 && (
          <TorrentStatsBar stats={stats} />
        )}

        {/* Clear completed button */}
        {hasCompleted && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearCompleted}>
            <Text style={styles.clearBtnText}>Clear completed</Text>
          </TouchableOpacity>
        )}

        {/* Torrent list */}
        {!loaded ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : torrents.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No torrents</Text>
            <Text style={styles.emptyText}>
              Tap the "+ Add" button to add a magnet link and start downloading.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {torrents.map((torrent) => (
              <TorrentCard
                key={torrent.id}
                torrent={torrent}
                onPause={handlePause}
                onResume={handleResume}
                onRemove={handleRemove}
              />
            ))}
          </View>
        )}

        {/* Navigation back */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => router.push('/')}
        >
          <Text style={styles.navBtnText}>Back to Medicine Tracker</Text>
        </TouchableOpacity>
      </ScrollView>

      <AddTorrentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.darkText,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.midGrey,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  clearBtn: {
    alignSelf: 'flex-end',
  },
  clearBtnText: {
    fontSize: Typography.fontSize.sm,
    color: '#2196F3',
    fontWeight: Typography.fontWeight.medium,
  },
  list: {
    gap: Spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.midGrey,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.lightGrey,
    textAlign: 'center',
    lineHeight: 20,
  },
  navBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navBtnText: {
    fontSize: Typography.fontSize.sm,
    color: '#2196F3',
    fontWeight: Typography.fontWeight.medium,
  },
});
