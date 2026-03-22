import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Radius } from '../theme/tokens';

interface ProgressBarProps {
  progress: number; // 0–1
  color: string;
  height?: number;
  backgroundColor?: string;
}

export function ProgressBar({
  progress,
  color,
  height = 6,
  backgroundColor = '#E8E5E0',
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
