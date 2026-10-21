import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type JobMilestoneKey = 'EN_ROUTE' | 'ARRIVED' | 'WORKING' | 'COMPLETED';

export interface MilestoneStepConfig {
  key: JobMilestoneKey;
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}

export interface VisualMilestoneStepperProps {
  currentStage: JobMilestoneKey;
  completedStages?: JobMilestoneKey[];
  onStagePress?: (stage: JobMilestoneKey) => void;
  compact?: boolean;
}

const STEPS: MilestoneStepConfig[] = [
  { key: 'EN_ROUTE', label: 'En Route', iconName: 'compass-outline' },
  { key: 'ARRIVED', label: 'Arrived', iconName: 'map-marker-check' },
  { key: 'WORKING', label: 'Working', iconName: 'wrench-outline' },
  { key: 'COMPLETED', label: 'Done', iconName: 'check-decagram' },
];

export const VisualMilestoneStepper: React.FC<VisualMilestoneStepperProps> = ({
  currentStage,
  completedStages = [],
  onStagePress,
  compact = false,
}) => {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStage);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {STEPS.map((step, index) => {
        const isCompleted = completedStages.includes(step.key) || index < currentIdx;
        const isActive = step.key === currentStage;
        const isUpcoming = !isCompleted && !isActive;

        return (
          <React.Fragment key={step.key}>
            {/* Step Node */}
            <TouchableOpacity
              activeOpacity={onStagePress ? 0.7 : 1}
              onPress={() => onStagePress && onStagePress(step.key)}
              disabled={!onStagePress}
              style={styles.stepItem}
            >
              <View
                style={[
                  styles.nodeCircle,
                  compact && styles.nodeCircleCompact,
                  isCompleted && styles.nodeCompleted,
                  isActive && styles.nodeActive,
                  isUpcoming && styles.nodeUpcoming,
                ]}
              >
                <MaterialCommunityIcons
                  name={isCompleted ? 'check' : step.iconName}
                  size={compact ? 14 : 18}
                  color={isActive ? '#FFFFFF' : isCompleted ? '#10B981' : '#94A3B8'}
                />
              </View>

              {!compact && (
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isCompleted && styles.stepLabelCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              )}
            </TouchableOpacity>

            {/* Connecting Track between nodes */}
            {index < STEPS.length - 1 && (
              <View
                style={[
                  styles.trackLine,
                  compact && styles.trackLineCompact,
                  (isCompleted || index < currentIdx) ? styles.trackFilled : styles.trackUnfilled,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

export default VisualMilestoneStepper;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  containerCompact: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  stepItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  nodeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  nodeCircleCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  nodeActive: {
    backgroundColor: '#0F172A',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nodeCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  nodeUpcoming: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
    letterSpacing: 0.2,
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  stepLabelCompleted: {
    color: '#059669',
  },
  trackLine: {
    flex: 1,
    height: 3,
    marginHorizontal: 4,
    marginBottom: 16, // balance text below node
    borderRadius: 2,
  },
  trackLineCompact: {
    marginBottom: 0,
    height: 2,
  },
  trackFilled: {
    backgroundColor: '#10B981',
  },
  trackUnfilled: {
    backgroundColor: '#E2E8F0',
  },
});
