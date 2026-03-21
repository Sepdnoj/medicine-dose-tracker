import { formatDistanceToNow, format } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Medicine, DoseStatus } from '../models/types';
import { Colors, Radius, Spacing, Typography } from '../theme/tokens';

interface StatusCardProps {
  medicine: Medicine;
  status: DoseStatus;
  now: Date;
}

export function StatusCard({ medicine, status, now }: StatusCardProps) {
  const { remaining, lastDose, nextEligible, canGiveNow, freesUpAt } = status;
  const used = medicine.maxIn24Hours - remaining;

  const renderBadge = () => {
    if (canGiveNow) {
      return (
        <View style={[styles.badge, { backgroundColor: '#E6F4EC' }]}>
          <Text style={[styles.badgeText, { color: Colors.safeGreen }]}>Can give now</Text>
        </View>
      );
    }
    if (remaining === 0 && freesUpAt) {
      return (
        <View style={[styles.badge, { backgroundColor: '#FFF0E6' }]}>
          <Text style={[styles.badgeText, { color: Colors.warningOrange }]}>
            Max reached · frees up {format(freesUpAt, 'HH:mm')}
          </Text>
        </View>
      );
    }
    if (nextEligible) {
      return (
        <View style={[styles.badge, { backgroundColor: '#FFF0E6' }]}>
          <Text style={[styles.badgeText, { color: Colors.warningOrange }]}>
            Next eligible: {format(nextEligible, 'HH:mm')}
          </Text>
        </View>
      );
    }
    return null;
  };

  const lastDoseText = lastDose
    ? formatDistanceToNow(new Date(lastDose.timestamp), { addSuffix: true, includeSeconds: false })
    : 'No doses yet';

  return (
    <View style={[styles.card, { borderLeftColor: medicine.colour }]}>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View style={[styles.dot, { backgroundColor: medicine.colour }]} />
          <Text style={styles.name}>{medicine.name}</Text>
        </View>
        <Text style={styles.doseCount}>
          <Text style={styles.doseUsed}>{used}</Text>
          <Text style={styles.doseTotal}>/{medicine.maxIn24Hours}</Text>
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Remaining today</Text>
          <Text style={[styles.statValue, { color: remaining === 0 ? Colors.warningOrange : Colors.darkText }]}>
            {remaining}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Last dose</Text>
          <Text style={styles.statValue}>{lastDoseText}</Text>
        </View>
      </View>

      {renderBadge()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.darkText,
  },
  doseCount: {
    fontSize: Typography.fontSize.xl,
  },
  doseUsed: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.darkText,
  },
  doseTotal: {
    fontSize: Typography.fontSize.base,
    color: Colors.midGrey,
  },
  body: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  stat: {
    gap: 2,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.midGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.darkText,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.xl,
  },
  badgeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});
