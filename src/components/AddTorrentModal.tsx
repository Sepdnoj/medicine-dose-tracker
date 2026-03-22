import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../theme/tokens';
import { isValidMagnetUri } from '../utils/torrentUtils';

interface AddTorrentModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (magnetUri: string) => void;
}

export function AddTorrentModal({ visible, onClose, onAdd }: AddTorrentModalProps) {
  const [magnetUri, setMagnetUri] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmed = magnetUri.trim();
    if (!trimmed) {
      setError('Please enter a magnet link');
      return;
    }
    if (!isValidMagnetUri(trimmed)) {
      setError('Invalid magnet link. Must start with magnet:?xt=urn:btih:');
      return;
    }
    onAdd(trimmed);
    setMagnetUri('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setMagnetUri('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Add Torrent</Text>
          <Text style={styles.subtitle}>
            Paste a magnet link to start downloading
          </Text>

          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="magnet:?xt=urn:btih:..."
            placeholderTextColor={Colors.lightGrey}
            value={magnetUri}
            onChangeText={(text) => {
              setMagnetUri(text);
              if (error) setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            numberOfLines={3}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>Add Torrent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.darkText,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.midGrey,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.darkText,
    backgroundColor: Colors.background,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: '#F44336',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.base,
    color: Colors.midGrey,
    fontWeight: Typography.fontWeight.medium,
  },
  addBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: '#2196F3',
  },
  addBtnText: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
});
