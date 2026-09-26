import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Theme } from '@/constants/theme';

const T = Theme.colors;

export type MobileSemanticStatus = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

export function getMobileSemanticCategory(status: string): MobileSemanticStatus {
  const s = (status || '').toLowerCase().trim();
  if (['active', 'approved', 'verified', 'completed', 'resolved', 'paid'].includes(s)) return 'success';
  if (['pending', 'under_review', 'in_review', 'dispatched', 'awaiting_payment'].includes(s)) return 'warning';
  if (['rejected', 'suspended', 'cancelled', 'disputed', 'overdue', 'failed'].includes(s)) return 'critical';
  if (['in_progress', 'assigned', 'scheduled'].includes(s)) return 'info';
  return 'neutral';
}

const PILL_COLORS: Record<MobileSemanticStatus, { bg: string; text: string; border: string }> = {
  success: { bg: T.mgmtPillSuccessBg, text: T.mgmtPillSuccessText, border: T.mgmtPillSuccessBorder },
  warning: { bg: T.mgmtPillWarningBg, text: T.mgmtPillWarningText, border: T.mgmtPillWarningBorder },
  critical: { bg: T.mgmtPillCriticalBg, text: T.mgmtPillCriticalText, border: T.mgmtPillCriticalBorder },
  info: { bg: T.mgmtPillInfoBg, text: T.mgmtPillInfoText, border: T.mgmtPillInfoBorder },
  neutral: { bg: T.mgmtPillNeutralBg, text: T.mgmtPillNeutralText, border: T.mgmtPillNeutralBorder },
};

export function MobileStatusPill({ status, label }: { status: string; label?: string }) {
  const cat = getMobileSemanticCategory(status);
  const colors = PILL_COLORS[cat] || PILL_COLORS.neutral;
  const displayLabel = label || status.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={[styles.pillDot, { backgroundColor: colors.text }]} />
      <Text style={[styles.pillText, { color: colors.text }]}>{displayLabel}</Text>
    </View>
  );
}

export interface ManagementCardProps {
  title: string;
  subtitle?: string;
  status?: string;
  statusLabel?: string;
  metadata?: Array<{ label: string; value: string }>;
  onPress?: () => void;
  actions?: Array<{
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  children?: React.ReactNode;
}

export function ManagementCard({
  title,
  subtitle,
  status,
  statusLabel,
  metadata,
  onPress,
  actions,
  children,
}: ManagementCardProps) {
  const CardContainer = onPress ? TouchableOpacity : View;

  return (
    <CardContainer
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, CARD_SHADOW]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {status && <MobileStatusPill status={status} label={statusLabel} />}
      </View>

      {/* Structured Metadata Rows */}
      {metadata && metadata.length > 0 && (
        <View style={styles.metaContainer}>
          {metadata.map((item, idx) => (
            <View key={idx} style={styles.metaRow}>
              <Text style={styles.metaLabel}>{item.label}</Text>
              <Text style={styles.metaValue} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Optional Custom Body */}
      {children}

      {/* Action Footer */}
      {actions && actions.length > 0 && (
        <View style={styles.actionRow}>
          {actions.map((act, idx) => {
            const isPrimary = act.variant === 'primary';
            const isDanger = act.variant === 'danger';
            return (
              <TouchableOpacity
                key={idx}
                onPress={act.onPress}
                style={[
                  styles.actionButton,
                  isPrimary && styles.actionPrimary,
                  isDanger && styles.actionDanger,
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    isPrimary && styles.actionPrimaryText,
                    isDanger && styles.actionDangerText,
                  ]}
                >
                  {act.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </CardContainer>
  );
}

const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#0A192F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  android: { elevation: 1 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  metaContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  actionPrimary: {
    backgroundColor: '#0A192F',
    borderColor: '#0A192F',
  },
  actionPrimaryText: {
    color: '#FFFFFF',
  },
  actionDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionDangerText: {
    color: '#B91C1C',
  },
});
