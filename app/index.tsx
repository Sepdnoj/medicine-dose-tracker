import React, { useEffect, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { MEDICINES } from '../src/config/medicines';
import { DoseLog } from '../src/components/DoseLog';
import { LiveIndicator } from '../src/components/LiveIndicator';
import { QuickAdd } from '../src/components/QuickAdd';
import { StatusCard } from '../src/components/StatusCard';
import { Timeline } from '../src/components/Timeline';
import { useDoseStore } from '../src/store/doseStore';
import { getDoseStatus } from '../src/utils/calculations';
import { Colors, Spacing, Typography } from '../src/theme/tokens';

const TICK_INTERVAL_MS = 15_000;

export default function HomeScreen() {
  const { doses, currentTime, isLive, addDose, deleteDose, setCurrentTime, toggleLive, loadDoses } =
    useDoseStore();

  // Load persisted doses on mount
  useEffect(() => {
    loadDoses();
  }, []);

  // Tick the live clock every 15 seconds
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (isLive) {
      tickRef.current = setInterval(() => {
        setCurrentTime(new Date());
      }, TICK_INTERVAL_MS);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isLive]);

  const now = currentTime;

  const statuses = Object.fromEntries(
    MEDICINES.map((m) => [m.id, getDoseStatus(doses, m, now)]),
  );

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
            <Text style={styles.title}>Medicine Tracker</Text>
            <Text style={styles.subtitle}>Rolling 24-hour dose log</Text>
          </View>
          <LiveIndicator isLive={isLive} onToggle={toggleLive} />
        </View>

        {/* Status cards */}
        <View style={styles.section}>
          {MEDICINES.map((medicine) => (
            <StatusCard
              key={medicine.id}
              medicine={medicine}
              status={statuses[medicine.id]}
              now={now}
            />
          ))}
        </View>

        {/* Timeline */}
        <View style={[styles.section, styles.card]}>
          <Timeline doses={doses} medicines={MEDICINES} now={now} />
        </View>

        {/* Quick add */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Log a dose</Text>
          <QuickAdd
            medicines={MEDICINES}
            statuses={statuses}
            onAddDose={addDose}
            now={now}
          />
        </View>

        {/* Dose log */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dose history</Text>
          <DoseLog
            doses={doses}
            medicines={MEDICINES}
            onDelete={deleteDose}
            now={now}
          />
        </View>

        {/* Torrent downloader link */}
        <TouchableOpacity
          style={styles.torrentLink}
          onPress={() => router.push('/torrents')}
        >
          <Text style={styles.torrentLinkText}>Torrent Downloader</Text>
          <Text style={styles.torrentLinkArrow}>{'>'}</Text>
        </TouchableOpacity>

        {/* Safety disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Not medical advice. Always follow your pharmacist/GP's guidance.
          </Text>
        </View>
      </ScrollView>
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
  section: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.midGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  torrentLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  torrentLinkText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: '#2196F3',
  },
  torrentLinkArrow: {
    fontSize: Typography.fontSize.lg,
    color: '#2196F3',
    fontWeight: Typography.fontWeight.bold,
  },
  disclaimer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.lightGrey,
    textAlign: 'center',
    lineHeight: 18,
  },
});
