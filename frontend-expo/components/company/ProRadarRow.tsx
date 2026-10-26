import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import InitialsAvatar from '../common/InitialsAvatar';

export type ProAvailabilityStatus = 'ONLINE' | 'ON_JOB' | 'OFFLINE';

export interface ProRadarStaff {
  id: string;
  name: string;
  avatarUrl?: string;
  status: ProAvailabilityStatus;
  distanceKm?: number;
  currentWorkload: number;
  rating: number;
  phone: string;
  skills: string[];
}

export interface ProRadarRowProps {
  staff: ProRadarStaff;
  onCallPress: (phone: string) => void;
  onChatPress: (staffId: string) => void;
  onAssignPress?: (staffId: string) => void;
  onPress?: () => void;
  isSelected?: boolean;
}

export const ProRadarRow: React.FC<ProRadarRowProps> = ({
  staff,
  onCallPress,
  onChatPress,
  onAssignPress,
  onPress,
  isSelected,
}) => {
  const isOnline = staff.status === 'ONLINE';
  const isOnJob = staff.status === 'ON_JOB';

  const statusConfig = isOnline
    ? { color: '#10B981', bg: '#ECFDF5', label: 'Online' }
    : isOnJob
    ? { color: '#F59E0B', bg: '#FEF3C7', label: 'On Job' }
    : { color: '#94A3B8', bg: '#F1F5F9', label: 'Offline' };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.cardContainer,
        isSelected && { borderColor: '#0284C7', borderWidth: 2, backgroundColor: '#F0F9FF' },
      ]}
    >
      <View style={styles.mainRow}>
        {/* Avatar with Status Pulse Ring */}
        <View style={styles.avatarWrapper}>
          <InitialsAvatar name={staff.name} size={42} />
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusConfig.color },
            ]}
          />
        </View>

        {/* Technician Details */}
        <View style={styles.detailsCol}>
          <View style={styles.nameRow}>
            <Text style={styles.staffName} numberOfLines={1}>
              {staff.name}
            </Text>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>{staff.rating.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {/* Status Chip */}
            <View
              style={[
                styles.miniChip,
                { backgroundColor: statusConfig.bg },
              ]}
            >
              <Text
                style={[
                  styles.miniChipText,
                  { color: statusConfig.color },
                ]}
              >
                {statusConfig.label}
              </Text>
            </View>

            {/* Distance Chip (only when live location data exists) */}
            {typeof staff.distanceKm === 'number' && (
              <View style={styles.miniChip}>
                <MaterialCommunityIcons name="map-marker-distance" size={11} color="#64748B" />
                <Text style={styles.miniChipText}>
                  {staff.distanceKm.toFixed(1)} km
                </Text>
              </View>
            )}

            {/* Workload */}
            <View style={styles.miniChip}>
              <MaterialCommunityIcons name="briefcase-outline" size={11} color="#64748B" />
              <Text style={styles.miniChipText}>
                {staff.currentWorkload} {staff.currentWorkload === 1 ? 'job' : 'jobs'}
              </Text>
            </View>
          </View>

          {/* Skill Tags (max 2) */}
          {staff.skills && staff.skills.length > 0 && (
            <View style={styles.skillRow}>
              {staff.skills.slice(0, 2).map((skill, idx) => (
                <View key={idx} style={styles.skillPill}>
                  <Text style={styles.skillText} numberOfLines={1}>
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons Column */}
        <View style={styles.actionsCol}>
          <View style={styles.iconButtonsRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onCallPress(staff.phone)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="phone-outline" size={18} color="#0284C7" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onChatPress(staff.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="chat-outline" size={18} color="#6366F1" />
            </TouchableOpacity>
          </View>

          {onAssignPress && isOnline && (
            <TouchableOpacity
              style={styles.assignPill}
              onPress={() => onAssignPress(staff.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.assignPillText}>Assign</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProRadarRow;

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
    marginRight: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  miniChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  skillRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  skillPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  skillText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500',
  },
  actionsCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  iconButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  assignPill: {
    marginTop: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  assignPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
