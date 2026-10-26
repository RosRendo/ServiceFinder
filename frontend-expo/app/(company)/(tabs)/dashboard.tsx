/**
 * Company Executive Command Cockpit
 * Feature: specs/009-company-cockpit-redesign
 * Reduced from 935 lines to modular, top-of-fold command architecture (<220 lines)
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView, View, StyleSheet, RefreshControl,
  ActivityIndicator, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { api } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import ErrorState from "@/components/common/ErrorState";
import CompanyCockpitHeader from "@/components/company/CompanyCockpitHeader";
import UrgentDispatchCarousel from "@/components/company/UrgentDispatchCarousel";
import FinancialCommandBar from "@/components/company/FinancialCommandBar";
import FleetQuickRadar from "@/components/company/FleetQuickRadar";
import CompanyMiniTrend from "@/components/company/CompanyMiniTrend";
import { UrgentDispatchCardItem, FleetRadarMember } from "@/types/cockpit";

export default function CompanyDashboard() {
  const router = useRouter();
  const setCompanyOpen = useSidebarStore((s) => s.setCompanyOpen);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [company, setCompany] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [urgentBookings, setUrgentBookings] = useState<UrgentDispatchCardItem[]>([]);
  const [staffList, setStaffList] = useState<FleetRadarMember[]>([]);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [compRes, metRes, bookRes, staffRes] = await Promise.all([
        api.get("/api/companies/my-company").catch(() => null),
        api.get("/api/companies/my-company/metrics?period=week").catch(() => null),
        api.get("/api/bookings").catch(() => null),
        api.get("/api/companies/my-company/staff").catch(() => null),
      ]);

      if (compRes?.data) {
        setCompany(compRes.data?.data || compRes.data);
      }
      if (metRes?.data) {
        setMetrics(metRes.data?.data || metRes.data);
      }

      // Process Bookings
      const rawBookings = bookRes?.data?.data?.bookings || bookRes?.data?.bookings || bookRes?.data?.data || [];
      const pending = rawBookings.filter((b: any) => b.status === "pending");
      const mappedUrgent: UrgentDispatchCardItem[] = pending.map((b: any) => {
        const notes = (b.customerNotes || "").toLowerCase();
        const isUrgent = b.isInstant || notes.includes("urgent") || notes.includes("asap");
        return {
          id: b.id,
          customerName: b.customer?.name || b.customerName || "Customer",
          serviceName: b.service?.name || b.serviceName || "Home Service",
          bookingDate: b.bookingDate,
          startTime: b.startTime,
          payoutAmount: b.companyEarnings != null ? Number(b.companyEarnings) : null,
          serviceAddress: b.serviceAddress || "Address on dispatch",
          isInstant: isUrgent,
          deadlineMinutes: isUrgent ? 15 : 45,
        };
      });
      setUrgentBookings(mappedUrgent);
      setInProgressCount(rawBookings.filter((b: any) => b.status === "in_progress").length);
      setTodayCompletedCount(rawBookings.filter((b: any) => b.status === "completed").length);

      let rawStaff = staffRes?.data;
      if (rawStaff?.success) rawStaff = rawStaff.data;
      if (rawStaff?.data) rawStaff = rawStaff.data;
      setStaffList(Array.isArray(rawStaff) ? rawStaff.map((m: any) => ({
        id: String(m.id || m.userId),
        name: m.fullName || m.name || m.user?.name || "Technician",
        status: m.status === "inactive" || m.status === "offline" ? "OFFLINE" : m.isAvailable === false ? "ON_JOB" : "ONLINE",
        activeJobCount: m.status !== "inactive" && m.isAvailable === false ? 1 : 0,
        phone: m.phone || m.user?.phone || "",
      })) : []);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const handleAcceptBooking = async (id: string | number) => {
    try {
      await api.patch(`/api/bookings/${id}/status`, { status: "confirmed" });
      Toast.show({ type: "success", text1: "Booking Accepted", text2: "Dispatched to queue." });
      loadDashboardData(true);
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Error", text2: e.response?.data?.message || "Failed to accept booking." });
    }
  };

  const handleDeclineBooking = (id: string | number) => {
    Alert.alert("Decline Booking", "Release this booking back to the dispatch pool?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline", style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/api/bookings/${id}/status`, { status: "cancelled" });
            Toast.show({ type: "info", text1: "Booking Declined", text2: "Customer notified." });
            loadDashboardData(true);
          } catch (e: any) {
            Toast.show({ type: "error", text1: "Error", text2: e.response?.data?.message || "Failed to decline." });
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      {/* 1. Executive Top Header */}
      <CompanyCockpitHeader
        companyName={company?.name || "Command Cockpit"}
        isVerified={company?.isVerified ?? true}
        onlineCrewCount={staffList.filter((s) => s.status === "ONLINE").length}
        inProgressJobsCount={inProgressCount}
        todayCompletedCount={todayCompletedCount}
        slaComplianceRate={metrics?.completionRate ?? null}
        onMenuPress={() => setCompanyOpen(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboardData(true)}
            tintColor="#0A192F"
          />
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0A192F" />
          </View>
        ) : hasError && !metrics ? (
          <ErrorState onRetry={() => loadDashboardData()} />
        ) : (
          <>
            {/* 2. Immediate Top-of-Fold Urgent Dispatch Queue */}
            <UrgentDispatchCarousel
              bookings={urgentBookings}
              onAccept={handleAcceptBooking}
              onDecline={handleDeclineBooking}
              onViewAll={() => router.push("/(company)/(tabs)/operations" as any)}
            />

            {/* 3. Financial Command Bar */}
            <FinancialCommandBar
              availableBalance={metrics?.availableBalance || 0}
              escrowBalance={metrics?.escrowBalance || 0}
              unremittedCrewCash={metrics?.unremittedCash || 0}
              todayNetRevenue={metrics?.todayRevenue ?? null}
              onWithdrawPress={() => router.push("/(company)/payments" as any)}
              onAuditCashPress={() => router.push("/(company)/(tabs)/finance" as any)}
            />

            {/* 4. Live Fleet Quick Radar */}
            <FleetQuickRadar
              staffList={staffList}
              onViewAllPress={() => router.push("/(company)/(tabs)/staff" as any)}
              onCallPress={(phone) => Linking.openURL(`tel:${phone}`).catch(() => {})}
              onChatPress={(staffId, name) => router.push(`/(company)/chat/${staffId}?name=${encodeURIComponent(name)}` as any)}
            />

            {/* 5. Compact 7-Day Velocity Sparkline */}
            <View style={styles.trendWrap}>
              <CompanyMiniTrend
                data={metrics?.weeklyData}
                completionRate={metrics?.completionRate}
                totalRevenue={metrics?.revenue}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollBody: {
    paddingTop: 12,
    paddingBottom: 96,
  },
  trendWrap: {
    paddingHorizontal: 16,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
});
