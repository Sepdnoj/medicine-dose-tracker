import { format, addHours, subHours, parseISO, differenceInMinutes } from 'date-fns';
import React, { useRef } from 'react';
import { ScrollView, View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { Dose, Medicine } from '../models/types';
import { Colors, Typography } from '../theme/tokens';
import { getNextEligible, getLastDose } from '../utils/calculations';

interface TimelineProps {
  doses: Dose[];
  medicines: Medicine[];
  now: Date;
}

const TRACK_HEIGHT = 28;
const TRACK_GAP = 16;
const HOUR_WIDTH = 56;          // px per hour
const TOTAL_HOURS = 30;         // 24 past + 6 future
const LEFT_LABEL_W = 58;
const HEADER_H = 24;
const DOT_R = 7;
const CANVAS_WIDTH = HOUR_WIDTH * TOTAL_HOURS;
const CANVAS_HEIGHT = HEADER_H + (TRACK_HEIGHT + TRACK_GAP) * 2 + 8;

function timeToX(time: Date, windowStart: Date): number {
  return (differenceInMinutes(time, windowStart) / 60) * HOUR_WIDTH;
}

export function Timeline({ doses, medicines, now }: TimelineProps) {
  const windowStart = subHours(now, 24);
  const windowEnd = addHours(now, 6);

  const nowX = timeToX(now, windowStart);

  return (
    <View>
      <Text style={styles.title}>24-hour timeline</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: Math.max(0, nowX - 200), y: 0 }}
      >
        <View style={styles.wrapper}>
          {/* Row labels */}
          <View style={[styles.labels, { height: CANVAS_HEIGHT }]}>
            <View style={{ height: HEADER_H }} />
            {medicines.map((m) => (
              <View
                key={m.id}
                style={[styles.label, { height: TRACK_HEIGHT, marginBottom: TRACK_GAP }]}
              >
                <View style={[styles.labelDot, { backgroundColor: m.colour }]} />
                <Text style={styles.labelText}>{m.name}</Text>
              </View>
            ))}
          </View>

          {/* SVG canvas */}
          <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
            {/* Hour markers */}
            {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
              const t = addHours(windowStart, i);
              const x = i * HOUR_WIDTH;
              const isPast = t <= now;
              return (
                <React.Fragment key={i}>
                  <Line
                    x1={x} y1={HEADER_H} x2={x} y2={CANVAS_HEIGHT}
                    stroke={Colors.border}
                    strokeWidth={1}
                    strokeDasharray={isPast ? undefined : '4 3'}
                  />
                  <SvgText
                    x={x + 3} y={HEADER_H - 5}
                    fontSize={9}
                    fill={Colors.midGrey}
                    fontFamily="monospace"
                  >
                    {format(t, 'HH:mm')}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* NOW line */}
            <Line
              x1={nowX} y1={0} x2={nowX} y2={CANVAS_HEIGHT}
              stroke={Colors.darkText}
              strokeWidth={1.5}
            />
            <SvgText x={nowX + 3} y={10} fontSize={9} fill={Colors.darkText} fontWeight="bold">
              NOW
            </SvgText>

            {/* Shaded future region */}
            <Rect
              x={nowX} y={HEADER_H}
              width={CANVAS_WIDTH - nowX} height={CANVAS_HEIGHT - HEADER_H}
              fill={Colors.background}
              opacity={0.6}
            />

            {/* Dose dots & next-eligible dashes per medicine */}
            {medicines.map((medicine, mIdx) => {
              const trackY = HEADER_H + mIdx * (TRACK_HEIGHT + TRACK_GAP) + TRACK_HEIGHT / 2;
              const windowStart24 = subHours(now, 24);

              const lastDose = getLastDose(doses, medicine.id, now);
              const nextEligibleTime = lastDose ? getNextEligible(lastDose, medicine) : null;

              return (
                <React.Fragment key={medicine.id}>
                  {/* Track baseline */}
                  <Line
                    x1={0} y1={trackY} x2={CANVAS_WIDTH} y2={trackY}
                    stroke={Colors.border}
                    strokeWidth={1}
                  />

                  {/* Dose dots */}
                  {doses
                    .filter((d) => d.medicineId === medicine.id)
                    .map((dose) => {
                      const ts = parseISO(dose.timestamp);
                      if (ts < windowStart || ts > windowEnd) return null;
                      const x = timeToX(ts, windowStart);
                      const inWindow = ts >= windowStart24 && ts <= now;
                      return (
                        <Circle
                          key={dose.id}
                          cx={x} cy={trackY}
                          r={DOT_R}
                          fill={inWindow ? medicine.colour : Colors.fadedDot}
                          stroke={Colors.cardBg}
                          strokeWidth={2}
                        />
                      );
                    })}

                  {/* Next eligible dashed circle */}
                  {nextEligibleTime && nextEligibleTime > now && nextEligibleTime <= windowEnd && (
                    <Circle
                      cx={timeToX(nextEligibleTime, windowStart)} cy={trackY}
                      r={DOT_R}
                      fill="none"
                      stroke={medicine.colour}
                      strokeWidth={1.5}
                      strokeDasharray="3 2"
                      opacity={0.7}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Svg>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.midGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  wrapper: {
    flexDirection: 'row',
  },
  labels: {
    width: LEFT_LABEL_W,
    paddingRight: 8,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  labelDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  labelText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.midGrey,
    fontWeight: Typography.fontWeight.medium,
  },
});
