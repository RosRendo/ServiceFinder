import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { api, useAuthStore } from '@/store/authStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const T = {
  accent: "#0A192F",
  accentMid: "#1E3A8A",
  surface: "#FFFFFF",
  text1: "#111827",
  text2: "#4B5563",
  error: "#EF4444",
  warning: "#F59E0B"
};

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { logout, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'company' || user?.role === 'company_admin') {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const res = await api.get('/api/companies/my-company');
      const companyResponse = res.data;
      const company = companyResponse.data?.company || companyResponse.company || companyResponse.data || companyResponse;
      
      
      if (company.subscriptionStatus === 'trial' && company.trialEndsAt) {
        const endDate = new Date(company.trialEndsAt);
        setTrialEndsAt(endDate);
        if (new Date() > endDate) {
          setIsExpired(true);
        }
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubmitting(true);
    try {
      await api.post('/api/companies/subscription/upgrade', { planId: 'active' });
      Alert.alert("Success", "Your subscription is now active!");
      setIsExpired(false);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to upgrade subscription");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  if (isExpired) {
    return (
      <View style={s.modalContainer}>
        <View style={s.iconContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={80} color={T.warning} />
        </View>
        
        <Text style={s.title}>Trial Expired</Text>
        <Text style={s.message}>
          Your 3-month free trial ended on {trialEndsAt?.toLocaleDateString()}. 
          To continue managing your business, receiving bookings, and assigning staff, please subscribe to our Premium Plan.
        </Text>
        
        <View style={s.planBox}>
          <Text style={s.planTitle}>Premium Plan</Text>
          <Text style={s.planPrice}>$49<Text style={s.planInterval}>/month</Text></Text>
          <Text style={s.planFeature}>✓ Unlimited Staff Members</Text>
          <Text style={s.planFeature}>✓ Unlimited Service Listings</Text>
          <Text style={s.planFeature}>✓ Advanced Analytics</Text>
        </View>
        
        <TouchableOpacity 
          style={s.btnPrimary} 
          onPress={handleSubscribe}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.btnPrimaryText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={s.btnSecondary} onPress={logout}>
          <Text style={s.btnSecondaryText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {children}
    </>
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F7F8FC',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: T.accent,
    marginBottom: 16,
    textAlign: 'center'
  },
  message: {
    fontSize: 16,
    color: T.text2,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16
  },
  planBox: {
    backgroundColor: T.surface,
    padding: 24,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: T.accent,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: T.accent,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: T.accentMid,
    marginBottom: 16,
  },
  planInterval: {
    fontSize: 16,
    fontWeight: '500',
    color: T.text2,
  },
  planFeature: {
    fontSize: 15,
    color: T.text2,
    marginBottom: 8,
  },
  btnPrimary: {
    backgroundColor: T.accent,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondary: {
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: T.text2,
    fontSize: 16,
    fontWeight: '600',
  }
});
