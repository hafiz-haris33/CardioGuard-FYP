import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, spacing } from '../utils/theme';

interface IMUGraphProps {
  ax: number[];
  ay: number[];
  az: number[];
  motion: boolean;
}

export const IMUGraph: React.FC<IMUGraphProps> = ({ ax, ay, az, motion }) => {
  const chartWidth = Dimensions.get('window').width - spacing.lg * 2;

  const chartConfig = {
    backgroundGradientFrom: colors.surfaceContainerLow,
    backgroundGradientTo: colors.surfaceContainer,
    color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
    propsForDots: { r: '0' },
    decimalPlaces: 1, // Desimals ko 1 kar diya taake zyada clean nazar aaye
    strokeWidth: 2,
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>📡 Accelerometer — MPU6050</Text>
        {motion && (
          <View style={[styles.warnBadge, { backgroundColor: '#FF9500' }]}>
            <Text style={styles.badgeText}>Motion!</Text>
          </View>
        )}
      </View>

      <View style={styles.imuLegend}>
        <Text style={[styles.legendItem, { color: '#1E90FF' }]}>● X-axis</Text>
        <Text style={[styles.legendItem, { color: '#00CC66' }]}>● Y-axis</Text>
        <Text style={[styles.legendItem, { color: '#FFA500' }]}>● Z-axis</Text>
      </View>

      <LineChart
        data={{
          labels: ax.map(() => ''),
          datasets: [
            // UPDATED: Fallback array mein slightly different values daali hain taake chart-kit flatline crash na de
            { data: ax.length > 1 ? ax : [0, 0.1], color: () => '#1E90FF' },
            { data: ay.length > 1 ? ay : [0, 0.1], color: () => '#00CC66' },
            { data: az.length > 1 ? az : [0, 0.1], color: () => '#FFA500' },
          ],
        }}
        width={chartWidth}
        height={140}
        chartConfig={chartConfig}
        withDots={false}
        withInnerLines={false}
        withOuterLines={false}
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
  warnBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  imuLegend: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  legendItem: { fontSize: 12, fontWeight: '700' },
  chart: { borderRadius: 8, overflow: 'hidden', marginLeft: -8 },
});