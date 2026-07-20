import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { colors, spacing, typography } from '../utils/theme';

interface ECGGraphProps {
  waveform?: number[];       // raw ADC values 0-4095 from ESP32
  leadsOn?: boolean;         // ECG leads connected?
}

export const ECGGraph: React.FC<ECGGraphProps> = ({
  waveform = [],
  leadsOn = true,
}) => {

  // ── Mock ECG (shown when no real data) ──────────────────
  const generateMock = (): number[] => {
    const pts: number[] = [];
    for (let i = 0; i < 200; i++) {
      const t = (i / 200) * Math.PI * 6;
      const y = 2048
        + 800 * Math.sin(t)
        + 300 * Math.sin(t * 2.5)
        + 100 * Math.sin(t * 5);
      pts.push(Math.max(0, Math.min(4095, y)));
    }
    return pts;
  };

  const rawData = waveform.length > 10 ? waveform.slice(-200) : generateMock();
  const isMock  = waveform.length <= 10;

  // ── Normalize 0-4095 → 0-100 for SVG ───────────────────
  const min   = Math.min(...rawData);
  const max   = Math.max(...rawData);
  const range = max - min || 1;

  const normalized = rawData.map(v => ((v - min) / range) * 85 + 7); // 7–92% of height

  // ── Build SVG path ──────────────────────────────────────
  const svgW = 1000;
  const svgH = 100;

  const pathD = normalized
    .map((y, i) => {
      const x = (i / (normalized.length - 1)) * svgW;
      const yPos = svgH - y; // flip: high value = top
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yPos.toFixed(1)}`;
    })
    .join(' ');

  // ── Grid lines ──────────────────────────────────────────
  const gridLines = [25, 50, 75].map(y => (
    <Line
      key={y}
      x1="0" y1={y} x2={svgW} y2={y}
      stroke="rgba(255,255,255,0.06)"
      strokeWidth="1"
    />
  ));

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>⚡ Live ECG — AD8232</Text>
          <Text style={styles.subtitle}>
            {isMock ? 'Mock data — connect ESP32' : 'Real-time from ESP32'}
          </Text>
        </View>
        <View style={[styles.liveBadge, !leadsOn && styles.liveBadgeOff]}>
          <View style={[styles.liveDot, !leadsOn && styles.liveDotOff]} />
          <Text style={[styles.liveText, !leadsOn && styles.liveTextOff]}>
            {leadsOn ? 'LIVE' : 'LEADS OFF'}
          </Text>
        </View>
      </View>

      {/* Graph */}
      <View style={styles.graphContainer}>
        <Svg height={120} width="100%" viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="none">
          <Defs>
            <LinearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%"   stopColor={colors.tertiary}  stopOpacity="0.8" />
              <Stop offset="50%"  stopColor="#72fe88"           stopOpacity="1"   />
              <Stop offset="100%" stopColor={colors.tertiary}  stopOpacity="0.8" />
            </LinearGradient>
          </Defs>
          {gridLines}
          <Path
            d={pathD}
            stroke={leadsOn ? 'url(#ecgGrad)' : '#555'}
            strokeWidth="2"
            fill="none"
          />
        </Svg>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Samples</Text>
          <Text style={styles.statValue}>{rawData.length}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Min</Text>
          <Text style={styles.statValue}>{min}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max</Text>
          <Text style={styles.statValue}>{max}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Leads</Text>
          <Text style={[styles.statValue, { color: leadsOn ? colors.tertiary : colors.error }]}>
            {leadsOn ? 'On ✓' : 'Off ✗'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(28,32,40,0.6)',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.headlineMedium.fontSize,
    fontWeight: '700' as any,
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: typography.labelMedium.fontSize,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,167,65,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  liveBadgeOff: { backgroundColor: 'rgba(255,100,100,0.15)' },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.tertiary,
    marginRight: 6,
  },
  liveDotOff:  { backgroundColor: colors.error },
  liveText:    { fontSize: 12, fontWeight: '700' as any, color: colors.tertiary },
  liveTextOff: { color: colors.error },
  graphContainer: {
    height: 120,
    marginBottom: spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: spacing.sm,
  },
  statItem:  { flex: 1, alignItems: 'center' },
  divider:   { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  statLabel: { fontSize: 11, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '600' as any, color: colors.onSurface, marginTop: 2 },
});