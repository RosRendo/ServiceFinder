import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface CredentialInspectionItem {
  companyId: string;
  companyName: string;
  category: 'BUSINESS_LICENSE' | 'LIABILITY_INSURANCE' | 'ID_PROOF' | string;
  documentUrl: string;
  submittedDate: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}

export interface CredentialInspectionCardProps {
  item: CredentialInspectionItem;
  onVerify: (companyId: string, category: string) => void;
  onReject: (companyId: string, category: string) => void;
  onPreview: (documentUrl: string) => void;
}

export const CredentialInspectionCard: React.FC<CredentialInspectionCardProps> = ({
  item,
  onVerify,
  onReject,
  onPreview,
}) => {
  const isVerified = item.status === 'VERIFIED';
  const isRejected = item.status === 'REJECTED';
  const isPending = item.status === 'PENDING';

  const categoryLabel =
    item.category === 'BUSINESS_LICENSE'
      ? 'Business License'
      : item.category === 'LIABILITY_INSURANCE'
      ? 'Insurance Policy'
      : item.category === 'ID_PROOF'
      ? 'Government ID'
      : item.category;

  const statusConfig = isVerified
    ? { dotColor: '#059669', label: 'Verified' }
    : isRejected
    ? { dotColor: '#DC2626', label: 'Rejected' }
    : { dotColor: '#D97706', label: 'Review Due' };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {/* Document Thumbnail Preview */}
        <TouchableOpacity
          style={styles.thumbnailWrapper}
          onPress={() => onPreview(item.documentUrl)}
          activeOpacity={0.8}
        >
          {item.documentUrl ? (
            <Image
              source={{ uri: item.documentUrl }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#64748B" />
            </View>
          )}
          <View style={styles.zoomPill}>
            <MaterialCommunityIcons name="magnify-plus-outline" size={10} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Content Details */}
        <View style={styles.detailsCol}>
          <View style={styles.titleRow}>
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {categoryLabel}
            </Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
              <Text style={styles.statusText}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <Text style={styles.companyName} numberOfLines={1}>
            {item.companyName}
          </Text>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-clock" size={12} color="#94A3B8" />
            <Text style={styles.dateText}>Submitted: {item.submittedDate}</Text>
          </View>
        </View>
      </View>

      {/* Decision Actions for Pending */}
      {isPending && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onReject(item.companyId, item.category)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="close" size={14} color="#DC2626" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.verifyBtn}
            onPress={() => onVerify(item.companyId, item.category)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            <Text style={styles.verifyText}>Verify Document</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CredentialInspectionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
    marginRight: 12,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomPill: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 4,
    padding: 2,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
    marginRight: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  companyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  rejectText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  verifyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  verifyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
