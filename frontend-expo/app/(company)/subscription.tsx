/**
 * Company Subscription Screen
 * Shows current plan, trial status, and upgrade options.
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/utils/api";

const T = {
  bg: "#FFFFFF", surface: "#FFFFFF", border: "#EBEBEB",
  accent: "#0A192F", accentMid: "#1E3A8A",
  text1: "#111827", text2: "#717171", text3: "#B0B0B0",
  success: "#00A699", warning: "#FFB800", gold: "#D97706",
  purple: "#7C3AED", purpleBg: "#EDE9FE",
};

const SHADOW = {};

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year";
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    interval: "month",
    features: [
      "Up to 3 active services",
      "Basic analytics",
      "Email support",
      "Standard listing",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 49,
    interval: "month",
    features: [
      "Unlimited services",
      "Advanced analytics & reports",
      "Priority support",
      "Featured listing",
      "Staff management (up to 10)",
      "Custom coverage areas",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    interval: "month",
    features: [
      "Everything in Professional",
      "Unlimited staff",
      "Dedicated account manager",
      "API access",
      "White-label options",
      "SLA guarantee",
    ],
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>("starter");
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get("/api/companies/subscription");
      const data = res.data;
      setCurrentPlan(data?.plan || "starter");
      if (data?.trialEndsAt) {
        const daysLeft = Math.max(
          0,
          Math.ceil((new Date(data.trialEndsAt).getTime() - Date.now()) / 86_400_000)
        );
        setTrialDaysLeft(daysLeft);
      }
    } catch {
      // No subscription endpoint yet — default to starter + trial badge
      setTrialDaysLeft(83);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan: Plan) => {
    if (plan.id === currentPlan) return;
    if (plan.price === 0) {
      Alert.alert("Downgrade", "To downgrade, please contact our support team.");
      return;
    }
    Alert.alert(
      `Upgrade to ${plan.name}`,
      `You will be charged $${plan.price}/month. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade",
          onPress: async () => {
            setUpgrading(plan.id);
            try {
              await api.post("/api/companies/subscription/upgrade", { planId: plan.id });
              setCurrentPlan(plan.id);
              setTrialDaysLeft(null);
              Alert.alert("Success 🎉", `You're now on the ${plan.name} plan!`);
            } catch {
              Alert.alert("Error", "Could not process upgrade. Please try again.");
            } finally {
              setUpgrading(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Subscription</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={T.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const activePlan = PLANS.find((p) => p.id === currentPlan) ?? PLANS[0];

  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={T.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Trial Banner */}
        {trialDaysLeft !== null && (
          <View style={s.trialBanner}>
            <MaterialCommunityIcons name="clock-fast" size={22} color={T.gold} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.trialTitle}>
                {trialDaysLeft > 0
                  ? `Free Trial — ${trialDaysLeft} days remaining`
                  : "Trial Expired"}
              </Text>
              <Text style={s.trialSub}>
                {trialDaysLeft > 0
                  ? "Upgrade now to keep all features after your trial ends."
                  : "Choose a plan below to continue using ServiceFinder."}
              </Text>
            </View>
          </View>
        )}

        {/* Current Plan Card */}
        <View style={s.currentCard}>
          <View style={s.currentCardTop}>
            <View>
              <Text style={s.currentLabel}>CURRENT PLAN</Text>
              <Text style={s.currentPlanName}>{activePlan.name}</Text>
            </View>
            <View style={[s.planBadge, activePlan.highlighted && s.planBadgeHighlighted]}>
              <Text style={[s.planBadgeText, activePlan.highlighted && s.planBadgeTextHighlighted]}>
                {activePlan.price === 0 ? "Free" : `$${activePlan.price}/mo`}
              </Text>
            </View>
          </View>
          <View style={s.divider} />
          {activePlan.features.map((f) => (
            <View key={f} style={s.featureRow}>
              <MaterialCommunityIcons name="check-circle" size={16} color={T.success} />
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <Text style={s.sectionTitle}>Available Plans</Text>

        {PLANS.map((plan) => {
          const isActive = plan.id === currentPlan;
          const isUpgrading = upgrading === plan.id;

          return (
            <View
              key={plan.id}
              style={[
                s.planCard,
                plan.highlighted && s.planCardHighlighted,
                isActive && s.planCardActive,
              ]}
            >
              {plan.highlighted && !isActive && (
                <View style={s.popularBadge}>
                  <Text style={s.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={s.planCardHeader}>
                <View>
                  <Text style={[s.planName, plan.highlighted && { color: T.accent }]}>
                    {plan.name}
                  </Text>
                  <Text style={s.planPrice}>
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                    {plan.price > 0 && <Text style={s.planInterval}>/month</Text>}
                  </Text>
                </View>
                {isActive && (
                  <View style={s.activeBadge}>
                    <MaterialCommunityIcons name="check" size={14} color="#fff" />
                    <Text style={s.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>

              <View style={s.planDivider} />

              {plan.features.map((f) => (
                <View key={f} style={s.featureRow}>
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={15}
                    color={plan.highlighted ? T.accent : T.text2}
                  />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}

              {!isActive && (
                <TouchableOpacity
                  style={[
                    s.upgradeBtn,
                    plan.highlighted && s.upgradeBtnHighlighted,
                    isUpgrading && { opacity: 0.7 },
                  ]}
                  onPress={() => handleUpgrade(plan)}
                  disabled={isUpgrading !== null}
                >
                  {isUpgrading ? (
                    <ActivityIndicator color={plan.highlighted ? "#fff" : T.accent} size="small" />
                  ) : (
                    <Text
                      style={[
                        s.upgradeBtnText,
                        plan.highlighted && s.upgradeBtnTextHighlighted,
                      ]}
                    >
                      {plan.price === 0 ? "Downgrade" : `Upgrade to ${plan.name}`}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Billing Info */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={18} color={T.text3} />
          <Text style={s.infoText}>
            Subscriptions are billed monthly. Cancel anytime. For annual billing or custom
            enterprise pricing, contact{" "}
            <Text style={{ color: T.accentMid, fontWeight: "700" }}>billing@servicefinder.com</Text>.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: T.surface, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: T.text1 },
  scroll: { padding: 16 },

  trialBanner: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A",
    borderRadius: 16, padding: 16, marginBottom: 20,
  },
  trialTitle: { fontSize: 15, fontWeight: "700", color: "#92400E" },
  trialSub: { fontSize: 13, color: "#B45309", marginTop: 2 },

  currentCard: {
    backgroundColor: T.surface, borderRadius: 20,
    padding: 20, 
  },
  currentCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  currentLabel: { fontSize: 10, fontWeight: "800", color: T.text3, letterSpacing: 1.2 },
  currentPlanName: { fontSize: 22, fontWeight: "800", color: T.accent, marginTop: 4 },
  planBadge: { backgroundColor: T.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: T.border },
  planBadgeHighlighted: { backgroundColor: T.accent, borderColor: T.accent },
  planBadgeText: { fontSize: 14, fontWeight: "700", color: T.text2 },
  planBadgeTextHighlighted: { color: "#fff" },
  divider: { height: 1, backgroundColor: T.border, marginBottom: 12 },

  sectionTitle: { fontSize: 13, fontWeight: "800", color: T.text3, letterSpacing: 1.1, marginBottom: 12 },

  planCard: {
    backgroundColor: T.surface, borderRadius: 20, padding: 20,
    
  },
  planCardHighlighted: { borderColor: T.accent, borderWidth: 2 },
  planCardActive: { borderColor: T.success, borderWidth: 2 },

  popularBadge: {
    alignSelf: "flex-start", backgroundColor: T.accent,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 12,
  },
  popularBadgeText: { fontSize: 10, fontWeight: "800", color: "#fff", letterSpacing: 1 },

  planCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  planName: { fontSize: 18, fontWeight: "800", color: T.text1 },
  planPrice: { fontSize: 24, fontWeight: "800", color: T.text1, marginTop: 4 },
  planInterval: { fontSize: 14, fontWeight: "500", color: T.text3 },

  activeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: T.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  activeBadgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  planDivider: { height: 1, backgroundColor: T.border, marginBottom: 12 },

  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  featureText: { fontSize: 13, color: T.text2, flex: 1 },

  upgradeBtn: {
    marginTop: 16, borderRadius: 14, paddingVertical: 14,
    alignItems: "center", borderWidth: 1.5, borderColor: T.accent,
  },
  upgradeBtnHighlighted: { backgroundColor: T.accent, borderColor: T.accent },
  upgradeBtnText: { fontSize: 14, fontWeight: "700", color: T.accent },
  upgradeBtnTextHighlighted: { color: "#fff" },

  infoCard: {
    flexDirection: "row", backgroundColor: T.surface,
    borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: T.border,
  },
  infoText: { flex: 1, fontSize: 12, color: T.text3, lineHeight: 18 },
});
