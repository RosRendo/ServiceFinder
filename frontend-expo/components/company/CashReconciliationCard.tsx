import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface CashReconciliationCardProps {
  currentCash: number;
  maxLimit: number;
  currencySymbol?: string;
  onSettlePress?: () => void;
  staffName?: string;
}

export const CashReconciliationCard: React.FC<CashReconciliationCardProps> = ({
  currentCash,
  maxLimit,
  currencySymbol = '$',
  onSettlePress,
  staffName,
}) => {
  const percentage = maxLimit > 0 ? Math.min(Math.round((currentCash / maxLimit) * 100), 100) : 0;
  const isBreached = currentCash >= maxLimit && maxLimit > 0;
  const isWarning = percentage >= 75 && !isBreached;

  const color = isBreached ? '#EF4444' : isWarning ? '#F59E0B' : '#10B981';
  const bgColor = isBreached ? '#FEF2F2' : isWarning ? '#FEF3C7' : '#ECFDF5';
  const label = isBreached ? 'Remittance Due' : isWarning ? 'Near Ceiling' : 'Healthy Balance';
  const icon = isBreached ? 'alert-octagon' : isWarning ? 'alert-circle-outline' : 'shield-check-outline';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.cardTitle}>
            {staffName ? `${staffName}'s Cash Hold` : 'Cash In Hand'}
          </Text>
          <Text style={styles.cardSub}>Physical customer payments</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
          <MaterialCommunityIcons name={icon as any} size={13} color={color} />
          <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
      </View>

      <View style={styles.numbersRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Unremitted</Text>
          <Text style={[styles.largeAmount, { color: isBreached ? '#EF4444' : '#0F172A' }]}>
            {currencySymbol}{currentCash.toFixed(2)}
          </Text>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Max Ceiling</Text>
          <Text style={styles.limitAmount}>
            {currencySymbol}{maxLimit.toFixed(2)}
          </Text>
        </View>

        {onSettlePress && (
          <TouchableOpacity
            style={styles.settleBtn}
            onPress={onSettlePress}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cash-check" size={16} color="#FFFFFF" />
            <Text style={styles.settleBtnText}>Settle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Visual Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerPercentText}>{percentage}% of credit limit</Text>
        <Text style={styles.footerAvailableText}>
          {currencySymbol}{Math.max(0, maxLimit - currentCash).toFixed(2)} remaining before lock
        </Text>
      </View>
    </View>
  );
};

export default CashReconciliationCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricItem: {
    marginRight: 14,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginRight: 14,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  largeAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  limitAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  settleBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  settleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerPercentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  footerAvailableText: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
