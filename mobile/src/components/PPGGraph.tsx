import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing } from '../utils/theme';

interface PPGGraphProps {
  waveform: number[];
  fingerOn: boolean;
  calibrated: boolean;
  instantBpm: number | null;
  avgBpm: number | null;
  connectionState: string;
}

export const PPGGraph: React.FC<PPGGraphProps> = ({
  waveform,
  fingerOn,
  calibrated,
  instantBpm,
  avgBpm,
  connectionState,
}) => {
  const chartWidth = Dimensions.get('window').width - spacing.lg * 2;

  const bpmColor = (bpm: number | null) =>
    !bpm ? '#888' : bpm < 60 ? '#4488FF' : bpm > 100 ? '#FF4444' : colors.tertiary;

  const chartConfig = {
    backgroundGradientFrom: colors.surfaceContainerLow,
    backgroundGradientTo: colors.surfaceContainer,
    color: (opacity = 1) => `rgba(255, 68, 68, ${opacity})`, // Red color for PPG
    propsForDots: { r: '0' },
    decimalPlaces: 2,
    strokeWidth: 2,
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>❤  PPG — MAX30102</Text>
        {!fingerOn && connectionState === 'connected' && (
          <View style={styles.warnBadge}>
            <Text style={styles.badgeText}>Place Finger</Text>
          </View>
        )}
      </View>

      {/* BPM Display */}
      <View style={styles.bpmRow}>
        <Text style={[styles.bpmValue, { color: bpmColor(avgBpm) }]}>
          {avgBpm != null ? Math.round(avgBpm) : '--'}
        </Text>
        <View>
          <Text style={styles.bpmUnit}>BPM</Text>
          {instantBpm != null && (
            <Text style={styles.bpmInstant}>Live: {Math.round(instantBpm)}</Text>
          )}
        </View>
        {!calibrated && fingerOn && (
          <Text style={styles.calibText}>Calibrating...</Text>
        )}
      </View>

      <LineChart
        data={{
          labels: waveform.map(() => ''),
          datasets: [{ data: waveform.length > 1 ? waveform : [0, 0] }],
        }}
        width={chartWidth}
        height={120}
        chartConfig={chartConfig}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
        bezier
        fromZero={false}
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    borderRadius: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardTitle: { fontWeight: '700', fontSize: 14, color: colors.onSurface },
  warnBadge: { backgroundColor: '#FF4444', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bpmRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginBottom: spacing.xs },
  bpmValue: { fontSize: 52, fontWeight: '800', lineHeight: 56 },
  bpmUnit: { fontSize: 16, color: '#888', paddingBottom: 8 },
  bpmInstant: { fontSize: 12, color: '#888' },
  calibText: { fontSize: 12, color: '#FFD700', marginLeft: 'auto' },
  chart: { borderRadius: 8, overflow: 'hidden', marginLeft: -8 },
});