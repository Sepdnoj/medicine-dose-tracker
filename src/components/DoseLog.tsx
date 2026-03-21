import { format, parseISO, subHours } from 'date-fns';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Dose, Medicine } from '../models/types';
import { Colors, Radius, Spacing, Typography } from '../theme/tokens';

interface DoseLogProps {
  doses: Dose[];
  medicines: Medicine[];
  onDelete: (id: string) => void;
  now: Date;
}

export function DoseLog({ doses, medicines, onDelete, now }: DoseLogProps) {
  const medicineMap = Object.fromEntries(medicines.map((m) => [m.id, m]));
  const windowStart = subHours(now, 24);

  const sorted = [...doses].sort(
    (a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime(),
  );

  const confirmDelete = (dose: Dose) => {
    const medicine = medicineMap[dose.medicineId];
    Alert.alert(
      'Delete dose?',
      `Remove ${medicine?.name ?? 'dose'} logged at ${format(parseISO(dose.timestamp), 'HH:mm, dd MMM')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(dose.id) },
      ],
    );
  };

  if (sorted.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No doses logged yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sorted.map((dose) => {
        const medicine = medicineMap[dose.medicineId];
        if (!medicine) return null;
        const ts = parseISO(dose.timestamp);
        const inWindow = ts >= windowStart && ts <= now;

        return (
          <View
            key={dose.id}
            style={[
              styles.row,
              { backgroundColor: inWindow ? medicine.bgColour : Colors.background },
            ]}
          >
            <View style={[styles.indicator, { backgroundColor: inWindow ? medicine.colour : Colors.fadedDot }]} />
            <View style={styles.info}>
              <Text style={styles.medicineName}>{medicine.name}</Text>
              <Text style={styles.timestamp}>
                {format(ts, 'HH:mm')}
                <Text style={styles.date}> · {format(ts, 'dd MMM yyyy')}</Text>
              </Text>
            </View>
            {!inWindow && (
              <Text style={styles.outTag}>outside window</Text>
            )}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => confirmDelete(dose)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  empty: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.lightGrey,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  medicineName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.darkText,
  },
  timestamp: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'monospace',
    color: Colors.midGrey,
  },
  date: {
    color: Colors.lightGrey,
  },
  outTag: {
    fontSize: Typography.fontSize.xs,
    color: Colors.lightGrey,
    fontStyle: 'italic',
  },
  deleteBtn: {
    paddingLeft: Spacing.sm,
  },
  deleteText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.lightGrey,
  },
});
