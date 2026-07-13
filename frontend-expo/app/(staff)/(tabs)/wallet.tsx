import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Platform, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore, api } from '@/store/authStore';
import { useFocusEffect } from 'expo-router';
import { useSidebarStore } from '@/store/sidebarStore';
import * as ImagePicker from 'expo-image-picker';

// ── Theme — exactly matches dashboard ───────────────────────────────────────
const T = {
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  primary:      '#0A192F',   // dark navy — same as dashboard hero card
  primaryLight: '#F0F4F8',
  accent:       '#0A192F',   // use navy as the main accent
  accentLight:  '#F0F4F8',
  text:         '#0F172A',
  textMuted:    '#64748B',
  border:       '#E2E8F0',
  success:      '#10B981',
  successLight: '#ECFDF5',
  amber:        '#F59E0B',
  amberLight:   '#FFFBEB',
  error:        '#EF4444',
  errorLight:   '#FEF2F2',
};

import { Theme } from "@/constants/theme";
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

const HERO_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 16 },
  android: { elevation: 8 },
});

function SkeletonBone({ width, height, radius = 8 }: { width: number | string; height: number; radius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: '#CBD5E1', opacity }} />;
}

function AnimatedWalletEmpty() {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -6, duration: 1000, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY: float }], alignItems: 'center', marginBottom: 8 }}>
      <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.border }}>
        <MaterialCommunityIcons name="cash-multiple" size={44} color={T.primary} />
      </View>
    </Animated.View>
  );
}

const BANKS = [
  'ABA Bank', 'ACLEDA Bank', 'Wing Bank', 'TrueMoney', 'Bakong',
  'Sathapana Bank', 'Canadia Bank', 'Other',
];

interface PaymentMethod {
  id: number; type: string; accountName: string;
  accountNumber: string; qrCodeUrl?: string;
  isDefault: boolean; isVerified: boolean;
}
interface Transaction {
  id: any; description: string; type: 'credit' | 'debit';
  amount: number; createdAt: string;
}

export default function StaffWalletScreen() {
  const { user } = useAuthStore();
  const setStaffOpen = useSidebarStore((s) => s.setStaffOpen);

  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance,    setBalance]    = useState(0);
  const [available,  setAvailable]  = useState(0);
  const [pendingAmt, setPendingAmt] = useState(0);
  const [paidAmt,    setPaidAmt]    = useState(0);
  const [txList,     setTxList]     = useState<Transaction[]>([]);
  const [payoutList, setPayoutList] = useState<any[]>([]);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  // Bank accounts
  const [accounts,     setAccounts]     = useState<PaymentMethod[]>([]);
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [bankType,     setBankType]     = useState(BANKS[0]);
  const [otherBank,    setOtherBank]    = useState('');
  const [acctName,     setAcctName]     = useState('');
  const [acctNumber,   setAcctNumber]   = useState('');
  const [qrUri,        setQrUri]        = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [savingAcct,   setSavingAcct]   = useState(false);

  // Payout
  const [payAmount,  setPayAmount]  = useState('');
  const [payMethod,  setPayMethod]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErrorMsg(null);
    try {
      let staffId: string | null = null;
      if (user?.id) {
        const uRes = await api.get(`/api/users/${user.id}`);
        const uData = uRes.data?.data?.user ?? uRes.data?.user ?? uRes.data;
        const memberships = uData?.staffMemberships;
        if (Array.isArray(memberships) && memberships.length > 0) {
          staffId = String(memberships[0].id);
        }
      }

      const [walletRes, payoutsRes, methodsRes] = await Promise.allSettled([
        staffId ? api.get(`/api/wallets/staff/${staffId}`) : Promise.reject('no id'),
        api.get('/api/staff/payouts'),
        api.get('/api/staff/payment-methods'),
      ]);

      if (walletRes.status === 'fulfilled') {
        const w = walletRes.value.data?.data ?? walletRes.value.data;
        setBalance(Number(w?.balance ?? 0));
        setTxList(Array.isArray(w?.transactions) ? w.transactions : []);
      }

      if (payoutsRes.status === 'fulfilled') {
        const d = payoutsRes.value.data?.data ?? payoutsRes.value.data;
        setAvailable(Number(d?.availableBalance ?? 0));
        const list = Array.isArray(d?.payouts) ? d.payouts : [];
        setPayoutList(list);
        setPaidAmt(list.filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0));
        setPendingAmt(list.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0));
      }

      if (methodsRes.status === 'fulfilled') {
        const d = methodsRes.value.data?.data ?? methodsRes.value.data;
        let raw = d?.paymentMethods ?? d?.methods ?? d;
        const methods: PaymentMethod[] = Array.isArray(raw) ? raw : [];
        setAccounts(methods);
        if (methods.length > 0 && !payMethod) {
          const def = methods.find(m => m.isDefault) ?? methods[0];
          setPayMethod(`${def.type} - ${def.accountNumber}`);
        }
      }
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message ?? 'Failed to load wallet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadAll(); }, [loadAll]));

  const fmt = (n: number) =>
    `$${Math.abs(Number(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── KHQR ─────────────────────────────────────────────────────────────────────
  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!r.canceled && r.assets?.length) setQrUri(r.assets[0].uri);
  };
  const uploadKhqr = async (uri: string) => {
    const name = uri.split('/').pop() ?? 'khqr.jpg';
    const ext = /\.(\w+)$/.exec(name);
    const form = new FormData();
    form.append('file', { uri, name, type: ext ? `image/${ext[1]}` : 'image/jpeg' } as any);
    const res = await api.post('/api/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data?.url ?? res.data?.imageUrl ?? null;
  };

  // ── Add account ───────────────────────────────────────────────────────────────
  const handleAddAccount = async () => {
    const finalType = bankType === 'Other' ? otherBank : bankType;
    if (!finalType.trim() || !acctName.trim() || !acctNumber.trim()) {
      Alert.alert('Missing Info', 'Please fill in all required fields.'); return;
    }
    setSavingAcct(true);
    try {
      let qrCodeUrl = null;
      if (qrUri) qrCodeUrl = await uploadKhqr(qrUri);
      await api.post('/api/staff/payment-methods', { type: finalType, accountName: acctName, accountNumber: acctNumber, qrCodeUrl, isDefault: accounts.length === 0 });
      Alert.alert('Saved!', 'Bank account added.');
      setShowAddForm(false); setQrUri(null); setAcctName(''); setAcctNumber(''); setOtherBank(''); setBankType(BANKS[0]);
      loadAll();
    } catch { Alert.alert('Error', 'Could not save account.'); }
    finally { setSavingAcct(false); }
  };

  const handleDeleteAccount = (id: number) => {
    Alert.alert('Delete', 'Remove this bank account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/api/staff/payment-methods/${id}`); loadAll(); }
        catch { Alert.alert('Error', 'Could not delete.'); }
      }},
    ]);
  };

  // ── Payout ────────────────────────────────────────────────────────────────────
  const hasPendingPayout = payoutList.some(p => p.status === 'pending');

  const handlePayout = async () => {
    if (hasPendingPayout) { Alert.alert('Pending Request', 'You already have a pending payout request.'); return; }
    const num = parseFloat(payAmount);
    if (isNaN(num) || num <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
    if (num > available) { Alert.alert('Insufficient', `Max available: ${fmt(available)}`); return; }
    if (!payMethod) { Alert.alert('No Method', 'Please add a bank account first.'); return; }
    setSubmitting(true);
    try {
      await api.post('/api/staff/payouts/request', { amount: num, method: payMethod });
      Alert.alert('Submitted!', 'Payout request sent.', [{ text: 'OK', onPress: () => { setPayAmount(''); loadAll(); } }]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to submit payout.');
    } finally { setSubmitting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <SkeletonBone width={120} height={24} />
            <SkeletonBone width={40} height={40} radius={20} />
          </View>
          <SkeletonBone width="100%" height={160} radius={20} />
          <SkeletonBone width="100%" height={100} radius={16} />
          <SkeletonBone width="100%" height={120} radius={16} />
        </View>
      </SafeAreaView>
    );
  }

  const isNeg = balance < 0;
  const payValid = (() => { const n = parseFloat(payAmount); return !isNaN(n) && n > 0 && n <= available && !!payMethod; })();

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAll(true)} tintColor={T.primary} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setStaffOpen(true)} style={s.menuBtn}>
              <MaterialCommunityIcons name="menu" size={26} color={T.primary} />
            </TouchableOpacity>
            <View>
              <Text style={s.headerTitle}>My Wallet</Text>
              <Text style={s.headerSub}>Manage earnings & payouts</Text>
            </View>
          </View>
          <View style={s.headerIcon}>
            <MaterialCommunityIcons name="wallet" size={22} color={T.primary} />
          </View>
        </View>

        {/* ── Balance Hero ────────────────────────────────────────────────────── */}
        <View style={[s.heroCard, isNeg && { backgroundColor: T.error}]}>
          <Text style={s.heroLabel}>Available Balance</Text>
          <Text style={s.heroAmt}>{isNeg ? '-' : ''}{fmt(available)}</Text>

          {isNeg ? (
            <View style={s.warningBox}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#991B1B" />
              <Text style={s.warningText}>
                You owe the company {fmt(Math.abs(balance))} from cash jobs. Hand this cash to your manager.
              </Text>
            </View>
          ) : (
            <View style={s.heroStats}>
              <View style={s.heroStat}>
                <Text style={s.heroStatLbl}>Paid Out</Text>
                <Text style={[s.heroStatVal, { color: '#A7F3D0' }]}>{fmt(paidAmt)}</Text>
              </View>
              <View style={s.heroDiv} />
              <View style={s.heroStat}>
                <Text style={s.heroStatLbl}>Pending</Text>
                <Text style={[s.heroStatVal, { color: '#FDE68A' }]}>{fmt(pendingAmt)}</Text>
              </View>
              <View style={s.heroDiv} />
              <View style={s.heroStat}>
                <Text style={s.heroStatLbl}>Gross</Text>
                <Text style={s.heroStatVal}>{fmt(balance)}</Text>
              </View>
            </View>
          )}
        </View>

        {errorMsg && (
          <View style={s.errorBox}>
            <MaterialCommunityIcons name="wifi-off" size={16} color={T.error} />
            <Text style={s.errorText}>{errorMsg}</Text>
            <TouchableOpacity onPress={() => loadAll()}>
              <Text style={{ color: T.primary, fontWeight: '700', fontSize: 13 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bank Accounts ───────────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBox}>
              <MaterialCommunityIcons name="bank" size={18} color={T.primary} />
            </View>
            <Text style={s.cardTitle}>Bank Accounts</Text>
          </View>

          {accounts.length > 0 ? (
            <View style={{ gap: 10, marginBottom: 14 }}>
              {accounts.map(acc => (
                <View key={acc.id} style={s.acctRow}>
                  <View style={s.acctIconBox}>
                    <MaterialCommunityIcons name="bank" size={18} color={T.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.acctBank}>{acc.type}</Text>
                    <Text style={s.acctName}>{acc.accountName}</Text>
                    <Text style={s.acctNum}>{acc.accountNumber}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {acc.isDefault && <View style={[s.chip, { backgroundColor: T.primaryLight }]}><Text style={[s.chipTxt, { color: T.primary }]}>Default</Text></View>}
                      {acc.isVerified && <View style={[s.chip, { backgroundColor: T.successLight }]}><Text style={[s.chipTxt, { color: T.success }]}>Verified</Text></View>}
                      {acc.qrCodeUrl && <View style={[s.chip, { backgroundColor: T.primaryLight }]}><MaterialCommunityIcons name="qrcode" size={10} color={T.primary} /><Text style={[s.chipTxt, { color: T.primary }]}>KHQR</Text></View>}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteAccount(acc.id)} style={{ padding: 6 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={T.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={s.emptyBox}>
              <MaterialCommunityIcons name="bank-off-outline" size={36} color="#CBD5E1" />
              <Text style={s.emptyText}>No bank accounts added yet.</Text>
            </View>
          )}

          {showAddForm ? (
            <View style={s.form}>
              <Text style={s.formTitle}>Add Bank Account</Text>

              <Text style={s.lbl}>Bank / Wallet *</Text>
              <TouchableOpacity style={s.dropdown} onPress={() => setShowDropdown(!showDropdown)}>
                <Text style={{ color: T.text }}>{bankType}</Text>
                <MaterialCommunityIcons name={showDropdown ? 'chevron-up' : 'chevron-down'} size={20} color={T.textMuted} />
              </TouchableOpacity>
              {showDropdown && (
                <View style={s.dropMenu}>
                  {BANKS.map((b, i) => (
                    <TouchableOpacity key={i} style={s.dropItem} onPress={() => { setBankType(b); setShowDropdown(false); }}>
                      <Text style={{ color: bankType === b ? T.primary : T.text, flex: 1, fontWeight: bankType === b ? '700' : '400' }}>{b}</Text>
                      {bankType === b && <MaterialCommunityIcons name="check" size={16} color={T.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {bankType === 'Other' && (
                <>
                  <Text style={[s.lbl, { marginTop: 14 }]}>Specify Bank Name *</Text>
                  <TextInput style={s.input} value={otherBank} onChangeText={setOtherBank} placeholder="Bank name" placeholderTextColor="#94A3B8" />
                </>
              )}

              <Text style={[s.lbl, { marginTop: 14 }]}>Account Name *</Text>
              <TextInput style={s.input} value={acctName} onChangeText={setAcctName} placeholder="e.g. Sok San" placeholderTextColor="#94A3B8" />

              <Text style={[s.lbl, { marginTop: 14 }]}>Account / Phone Number *</Text>
              <TextInput style={s.input} value={acctNumber} onChangeText={setAcctNumber} placeholder="012 345 678" keyboardType="numeric" placeholderTextColor="#94A3B8" />

              <Text style={[s.lbl, { marginTop: 14 }]}>KHQR Image (Optional)</Text>
              {qrUri ? (
                <View style={{ marginBottom: 6 }}>
                  <Image source={{ uri: qrUri }} style={{ width: '100%', height: 160, borderRadius: 12 }} resizeMode="contain" />
                  <TouchableOpacity style={s.removeBtn} onPress={() => setQrUri(null)}>
                    <MaterialCommunityIcons name="close" size={14} color={T.error} />
                    <Text style={{ color: T.error, fontSize: 12, fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.uploadBtn} onPress={pickImage}>
                  <MaterialCommunityIcons name="qrcode-scan" size={22} color={T.primary} />
                  <Text style={{ color: T.primary, fontWeight: '600' }}>Upload KHQR</Text>
                </TouchableOpacity>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAddForm(false); setQrUri(null); setOtherBank(''); }}>
                  <Text style={{ color: T.textMuted, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={handleAddAccount} disabled={savingAcct}>
                  {savingAcct
                    ? <ActivityIndicator color="#FFF" size="small" />
                    : <Text style={{ color: '#FFF', fontWeight: '700' }}>Save Account</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAddForm(true)}>
              <MaterialCommunityIcons name="plus" size={18} color={T.primary} />
              <Text style={{ color: T.primary, fontWeight: '700', fontSize: 14 }}>Add Bank Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Request Payout ──────────────────────────────────────────────────── */}
        {!isNeg && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIconBox}>
                <MaterialCommunityIcons name="cash-fast" size={18} color={T.primary} />
              </View>
              <Text style={s.cardTitle}>Request Payout</Text>
            </View>
            {hasPendingPayout ? (
              <View style={[s.emptyBox, { paddingVertical: 10, marginBottom: 10 }]}>
                <MaterialCommunityIcons name="clock-alert-outline" size={32} color={T.amber} style={{ marginBottom: 4 }} />
                <Text style={[s.emptyText, { color: T.text, fontWeight: '600' }]}>Pending Payout Request</Text>
                <Text style={[s.emptyText, { fontSize: 12, marginTop: 4 }]}>You already have a payout request being processed. Please wait for it to complete before requesting another.</Text>
              </View>
            ) : (
              <View>
                <Text style={s.lbl}>Amount</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <TextInput
                    style={[s.input, { flex: 1, marginBottom: 0 }]}
                    value={payAmount}
                    onChangeText={setPayAmount}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity style={s.maxBtn} onPress={() => setPayAmount(available.toFixed(2))}>
                    <Text style={{ color: T.primary, fontWeight: '700', fontSize: 13 }}>MAX</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: T.textMuted, fontSize: 12, marginBottom: 18 }}>
                  Available to withdraw: <Text style={{ color: T.text, fontWeight: '700' }}>{fmt(available)}</Text>
                </Text>

                <Text style={s.lbl}>Payout To</Text>
                {accounts.length === 0 ? (
                  <View style={[s.emptyBox, { marginBottom: 18 }]}>
                    <MaterialCommunityIcons name="bank-off-outline" size={28} color="#CBD5E1" />
                    <Text style={s.emptyText}>Add a bank account above first.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 8, marginBottom: 20 }}>
                    {accounts.map(pm => {
                      const key = `${pm.type} - ${pm.accountNumber}`;
                      const sel = payMethod === key;
                      return (
                        <TouchableOpacity key={pm.id} style={[s.methodRow, sel && s.methodRowSel]} onPress={() => setPayMethod(key)}>
                          <View style={[s.methodIcon, sel && { backgroundColor: T.primary }]}>
                            <MaterialCommunityIcons name="bank" size={18} color={sel ? '#FFF' : T.textMuted} />
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[s.methodName, sel && { color: T.primary }]}>{pm.type}</Text>
                            <Text style={s.methodSub}>{pm.accountName} · {pm.accountNumber}</Text>
                          </View>
                          {sel && <MaterialCommunityIcons name="check-circle" size={20} color={T.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  style={[s.submitBtn, !payValid && { opacity: 0.35 }]}
                  disabled={!payValid || submitting}
                  onPress={handlePayout}
                >
                  {submitting
                    ? <ActivityIndicator color="#FFF" />
                    : <>
                        <MaterialCommunityIcons name="send" size={18} color="#FFF" />
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Confirm Payout</Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Pending Payouts ─────────────────────────────────────────────────── */}
        {payoutList.filter(p => p.status === 'pending').length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardIconBox, { backgroundColor: T.amberLight }]}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={T.amber} />
              </View>
              <Text style={s.cardTitle}>Pending Payouts</Text>
            </View>
            {payoutList.filter(p => p.status === 'pending').map((p, i, arr) => (
              <View key={p.id} style={[s.txRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.txDesc}>Withdrawal to {p.method.split(' - ')[0] || p.method}</Text>
                  <Text style={s.txDate}>{new Date(p.requestedAt || p.createdAt || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <Text style={[s.txAmt, { color: T.amber }]}>-{fmt(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Transaction History ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardIconBox}>
              <MaterialCommunityIcons name="history" size={18} color={T.primary} />
            </View>
            <Text style={s.cardTitle}>Transaction History</Text>
          </View>

          {txList.length === 0 ? (
            <View style={s.emptyBox}>
              <AnimatedWalletEmpty />
              <Text style={s.emptyText}>No transactions yet.</Text>
            </View>
          ) : (
            txList.map((tx, i) => (
              <View key={tx.id} style={[s.txRow, i === txList.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[s.txIcon, { backgroundColor: tx.type === 'credit' ? T.successLight : T.errorLight }]}>
                  <MaterialCommunityIcons
                    name={tx.type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle'}
                    size={18}
                    color={tx.type === 'credit' ? T.success : T.error}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.txDesc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={s.txDate}>{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <Text style={[s.txAmt, { color: tx.type === 'credit' ? T.success : T.error }]}>
                  {tx.type === 'credit' ? '+' : '-'}{fmt(tx.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: T.bg },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border },
  menuBtn:     { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T.text },
  headerSub:   { fontSize: 13, color: T.textMuted, marginTop: 2 },
  headerIcon:  { width: 42, height: 42, borderRadius: 12, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' },

  heroCard:    { marginHorizontal: 16, marginTop: 16, backgroundColor: T.primary, borderRadius: 20, padding: 22, ...HERO_SHADOW },
  heroLabel:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  heroAmt:     { fontSize: 40, fontWeight: '900', color: '#FFF', marginBottom: 16 },
  heroStats:   { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 14 },
  heroStat:    { flex: 1, alignItems: 'center' },
  heroStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroStatVal: { fontSize: 14, fontWeight: '800', color: '#FFF', marginTop: 3 },
  heroDiv:     { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  warningBox:  { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 12, gap: 8, alignItems: 'flex-start' },
  warningText: { color: '#FEE2E2', fontSize: 12, flex: 1, lineHeight: 18 },

  errorBox:    { marginHorizontal: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.errorLight, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FECACA' },
  errorText:   { flex: 1, color: '#B91C1C', fontSize: 13 },

  card:        { marginHorizontal: 16, marginTop: 16, backgroundColor: T.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: T.border, ...CARD_SHADOW },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardTitle:   { fontSize: 16, fontWeight: '800', color: T.text },

  acctRow:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: T.bg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: T.border },
  acctIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' },
  acctBank:    { fontSize: 14, fontWeight: '700', color: T.text },
  acctName:    { fontSize: 12, color: T.textMuted, marginTop: 1 },
  acctNum:     { fontSize: 13, fontWeight: '600', color: T.text, marginTop: 1 },
  chip:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, gap: 3 },
  chipTxt:     { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  emptyBox:    { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyText:   { color: T.textMuted, fontSize: 13, textAlign: 'center' },

  form:        { backgroundColor: T.bg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  formTitle:   { fontSize: 16, fontWeight: '800', color: T.text, marginBottom: 14 },
  lbl:         { fontSize: 11, fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input:       { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 15, color: T.text, marginBottom: 4 },
  dropdown:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, paddingHorizontal: 14, height: 50 },
  dropMenu:    { backgroundColor: T.surface, borderRadius: 12,  },
  dropItem:    { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  uploadBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: T.primary, borderRadius: 12, height: 52 },
  removeBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8, padding: 6 },
  cancelBtn:   { flex: 1, height: 48, borderRadius: 12, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  saveBtn:     { flex: 2, height: 48, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', },

  maxBtn:      { backgroundColor: T.primaryLight, paddingHorizontal: 14, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', },
  addBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: T.primary },
  methodRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 12, marginBottom: 8 },
  methodRowSel:{ borderColor: T.primary, backgroundColor: T.primaryLight },
  methodIcon:  { width: 38, height: 38, borderRadius: 10, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' },
  methodName:  { fontSize: 14, fontWeight: '700', color: T.text },
  methodSub:   { fontSize: 12, color: T.textMuted, marginTop: 2 },
  submitBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.primary, height: 54, borderRadius: 14, borderWidth: 1, borderColor: T.border },

  txRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  txIcon:      { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txDesc:      { fontSize: 13, fontWeight: '600', color: T.text },
  txDate:      { fontSize: 11, color: T.textMuted, marginTop: 2 },
  txAmt:       { fontSize: 14, fontWeight: '800' },

  perfStat:    { flex: 1, backgroundColor: T.bg, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: T.border },
  perfStatVal: { fontSize: 18, fontWeight: '900', color: T.text },
  perfStatLbl: { fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },

  subHeading:  { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 10 },
  reviewCard:  { backgroundColor: T.bg, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border },
});
