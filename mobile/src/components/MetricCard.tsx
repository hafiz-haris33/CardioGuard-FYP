import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../utils/theme';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon}
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {trend && (
        <View style={styles.trend}>
          <Text style={[styles.trendText, { color: trend.isPositive ? colors.tertiary : colors.error }]}>
            {trend.isPositive ? '↓' : '↑'} {trend.value}% {trend.label}
          </Text>
        </View>
      )}

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${Math.min(value as number, 100)}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: `rgba(28, 32, 40, 0.4)`,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `rgba(255, 255, 255, 0.1)`,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.labelMedium.fontSize,
    fontWeight: typography.labelMedium.fontWeight as any,
    color: colors.onSurfaceVariant,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: typography.numericData.fontSize,
    fontWeight: typography.numericData.fontWeight as any,
    color: colors.onSurface,
  },
  unit: {
    fontSize: typography.labelMedium.fontSize,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  trend: {
    marginBottom: spacing.sm,
  },
  trendText: {
    fontSize: typography.labelMedium.fontSize,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.tertiary,
    borderRadius: 2,
  },
});
