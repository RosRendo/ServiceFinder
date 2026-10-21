import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '@/store/authStore';
import { Theme } from '@/constants/theme';

const T = Theme.colors;

interface AssignStaffModalProps {
  visible: boolean;
  bookingId: string | null;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignStaffModal({
  visible,
  bookingId,
  onClose,
  onAssigned,
}: AssignStaffModalProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadStaff();
    }
  }, [visible]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/companies/my-company/staff');
      const list = res.data?.data || res.data || [];
      // Sort: online first, then offline
      const sorted = [...list].sort((a, b) => {
        const aOnline = a.user?.workingStatus === 'online' ? 1 : 0;
        const bOnline = b.user?.workingStatus === 'online' ? 1 : 0;
        return bOnline - aOnline;
      });
      setStaffList(sorted);
    } catch (e) {
      console.warn('Failed to load company staff for assignment:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (staffMemberId: string) => {
    if (!bookingId) return;
    setAssigningId(staffMemberId);
    try {
      await api.patch(`/api/bookings/${bookingId}/assign-staff`, {
        staffId: staffMemberId,
      });
      Alert.alert('Success', 'Staff member assigned successfully.');
      onAssigned();
      onClose();
    } catch (e: any) {
      console.error('Failed to assign staff:', e);
      Alert.alert('Error', e?.response?.data?.message || 'Could not assign staff member.');
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          {/* Modal Header */}
          <View style={s.modalHeader}>
            <View>
              <Text style={s.modalTitle}>Dispatch to Technician</Text>
              <Text style={s.modalSubtitle}>Booking #{bookingId?.slice?.(-6)?.toUpperCase?.() || bookingId}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={T.text2} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={T.primary} />
              <Text style={s.loadingText}>Finding available crew...</Text>
            </View>
          ) : staffList.length === 0 ? (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="account-group-outline" size={40} color={T.text3} />
              <Text style={s.emptyTitle}>No Staff Members Registered</Text>
              <Text style={s.emptySub}>Invite team members under the Staff tab first.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
              {staffList.map((member) => {
                const name = member.user?.fullName || member.fullName || 'Technician';
                const isOnline = member.user?.workingStatus === 'online';
                const phone = member.user?.phone || member.phone || '';
                const role = member.role || 'Staff';
                const isAssigning = assigningId === String(member.id);

                return (
                  <View key={member.id} style={s.staffCard}>
                    <View style={s.staffInfoRow}>
                      <View style={[s.avatarCircle, isOnline && s.avatarCircleOnline]}>
                        <Text style={s.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                        <View style={[s.onlineDot, { backgroundColor: isOnline ? '#10B981' : '#94A3B8' }]} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={s.nameRow}>
                          <Text style={s.staffName}>{name}</Text>
                          <View style={[s.statusTag, isOnline ? s.statusTagOnline : s.statusTagOffline]}>
                            <Text style={[s.statusTagText, isOnline ? s.statusTagTextOnline : s.statusTagTextOffline]}>
                              {isOnline ? 'Available' : 'Off Shift'}
                            </Text>
                          </View>
                        </View>
                        <Text style={s.staffRole}>{role} {phone ? `· ${phone}` : ''}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[s.assignBtn, !isOnline && s.assignBtnSubtle]}
                      onPress={() => handleAssign(String(member.id))}
                      disabled={isAssigning}
                      activeOpacity={0.8}
                    >
                      {isAssigning ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="send" size={16} color="#FFF" />
                          <Text style={s.assignBtnText}>Assign</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  loadingBox: {
    padding: 50,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  staffInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarCircleOnline: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTagOnline: {
    backgroundColor: '#ECFDF5',
  },
  statusTagOffline: {
    backgroundColor: '#F1F5F9',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTagTextOnline: {
    color: '#059669',
  },
  statusTagTextOffline: {
    color: '#94A3B8',
  },
  staffRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  assignBtnSubtle: {
    backgroundColor: '#475569',
  },
  assignBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
