import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../theme/tokens';

interface LiveIndicatorProps {
  isLive: boolean;
  onToggle: () => void;
}

export function LiveIndicator({ isLive, onToggle }: LiveIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLive) {
      pulseAnim.setValue(1);
      return;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isLive, pulseAnim]);

  return (
    <TouchableOpacity style={styles.container} onPress={onToggle} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.dot,
          { opacity: pulseAnim, backgroundColor: isLive ? Colors.safeGreen : Colors.lightGrey },
        ]}
      />
      <Text style={[styles.label, { color: isLive ? Colors.safeGreen : Colors.lightGrey }]}>
        {isLive ? 'LIVE' : 'PAUSED'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 1.2,
  },
});
