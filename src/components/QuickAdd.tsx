import { format } from 'date-fns';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Medicine, DoseStatus } from '../models/types';
import { Colors, Radius, Spacing, Typography } from '../theme/tokens';

interface QuickAddProps {
  medicines: Medicine[];
  statuses: Record<string, DoseStatus>;
  onAddDose: (medicineId: string, timestamp?: string) => Promise<void>;
  now: Date;
}

export function QuickAdd({ medicines, statuses, onAddDose, now }: QuickAddProps) {
  const [pickerMedicine, setPickerMedicine] = useState<Medicine | null>(null);
  const [customTime, setCustomTime] = useState('');
  const [timeError, setTimeError] = useState('');

  const handlePress = (medicine: Medicine) => {
    const status = statuses[medicine.id];
    const timeStr = format(now, 'HH:mm dd/MM');

    Alert.alert(
      `Log ${medicine.name}`,
      `Record a dose of ${medicine.name} at ${timeStr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log now',
          onPress: () => onAddDose(medicine.id),
        },
        {
          text: 'Set time…',
          onPress: () => {
            setCustomTime(format(now, 'HH:mm'));
            setTimeError('');
            setPickerMedicine(medicine);
          },
        },
      ],
    );
  };

  const handleCustomSubmit = async () => {
    if (!pickerMedicine) return;

    const match = customTime.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) {
      setTimeError('Enter time as HH:MM (e.g. 14:30)');
      return;
    }

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours > 23 || minutes > 59) {
      setTimeError('Invalid time');
      return;
    }

    const ts = new Date(now);
    ts.setHours(hours, minutes, 0, 0);

    // If time is in the future, assume yesterday
    if (ts > now) {
      ts.setDate(ts.getDate() - 1);
    }

    await onAddDose(pickerMedicine.id, ts.toISOString());
    setPickerMedicine(null);
    setCustomTime('');
  };

  return (
    <>
      <View style={styles.container}>
        {medicines.map((medicine) => {
          const status = statuses[medicine.id];
          const enabled = status?.canGiveNow ?? false;

          return (
            <TouchableOpacity
              key={medicine.id}
              style={[
                styles.button,
                { backgroundColor: enabled ? medicine.colour : Colors.border },
              ]}
              onPress={() => handlePress(medicine)}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonName}>{medicine.name}</Text>
              <Text style={styles.buttonSub}>
                {enabled ? 'Tap to log dose' : 'Not yet'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom time modal */}
      <Modal
        visible={pickerMedicine !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerMedicine(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setPickerMedicine(null)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              Log {pickerMedicine?.name} — custom time
            </Text>
            <Text style={styles.modalSub}>Enter time (today, or yesterday if in future)</Text>
            <TextInput
              style={[styles.input, timeError ? styles.inputError : null]}
              value={customTime}
              onChangeText={(t) => { setCustomTime(t); setTimeError(''); }}
              placeholder="HH:MM"
              keyboardType="numbers-and-punctuation"
              autoFocus
              maxLength={5}
            />
            {timeError ? <Text style={styles.error}>{timeError}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setPickerMedicine(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: pickerMedicine?.colour }]}
                onPress={handleCustomSubmit}
              >
                <Text style={styles.modalConfirmText}>Log dose</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  buttonName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  buttonSub: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: Typography.fontWeight.medium,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    width: '80%',
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.darkText,
  },
  modalSub: {
    fontSize: Typography.fontSize.sm,
    color: Colors.midGrey,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.xl,
    fontFamily: 'monospace',
    color: Colors.darkText,
    letterSpacing: 2,
  },
  inputError: {
    borderColor: Colors.warningOrange,
  },
  error: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warningOrange,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: Typography.fontSize.base,
    color: Colors.midGrey,
    fontWeight: Typography.fontWeight.medium,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  modalConfirmText: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
});
