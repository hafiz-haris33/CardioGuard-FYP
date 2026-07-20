import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../utils/theme';

interface InsightCardProps {
  title: string;
  description: string;
  recommendation: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  recommendation,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🧠</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.recommendation}>{recommendation}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: `rgba(75, 142, 255, 0.05)`,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: `rgba(173, 198, 255, 0.2)`,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `rgba(75, 142, 255, 0.2)`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.headlineMedium.fontSize,
    fontWeight: typography.headlineMedium.fontWeight as any,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  recommendation: {
    fontSize: typography.bodyMedium.fontSize,
    color: colors.onSurface,
    lineHeight: 24,
  },
});
