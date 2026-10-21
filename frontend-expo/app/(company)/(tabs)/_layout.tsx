import React, { useRef, useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";
import { api } from "@/store/authStore";

const T = Theme.colors;

const NAV = {
  bg: T.mgmtSurface || '#FFFFFF',
  active: T.text1 || '#0A192F',
  inactive: T.mgmtTextSecondary || '#94A3B8',
  pill: T.mgmtSurfaceSubtle || '#F0F4F8',
  border: T.mgmtBorder || '#E8EEF4',
};

const TABS = [
  { name: 'dashboard', icon: 'view-dashboard-outline',           iconActive: 'view-dashboard',           label: 'Cockpit' },
  { name: 'operations',icon: 'radar',                            iconActive: 'radar',                    label: 'Dispatch' },
  { name: 'staff',     icon: 'account-group-outline',            iconActive: 'account-group',            label: 'Crew' },
  { name: 'finance',   icon: 'currency-usd',                     iconActive: 'currency-usd',             label: 'Finance' },
];

function FloatingTabBar({ state, descriptors, navigation, t, pendingCount }: any) {
  const scales = useRef(TABS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.88))).current;

  useEffect(() => {
    TABS.forEach((_, i) => {
      Animated.spring(scales[i], {
        toValue: i === state.index ? 1 : 0.88,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={nb.wrapper} pointerEvents="box-none">
      <View style={nb.container}>
        {TABS.map((tab, index) => {
          const route = state.routes.find((r: any) => r.name === tab.name);
          if (!route) return null;
          const isFocused = state.index === state.routes.findIndex((r: any) => r.name === tab.name);

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              activeOpacity={0.75}
              style={nb.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
            >
              <Animated.View style={[nb.iconWrap, isFocused && nb.iconWrapActive, { transform: [{ scale: scales[index] }] }]}>
                <View style={nb.iconInner}>
                  <MaterialCommunityIcons
                    name={(isFocused ? tab.iconActive : tab.icon) as any}
                    size={isFocused ? 24 : 22}
                    color={isFocused ? NAV.active : NAV.inactive}
                  />
                  {tab.name === 'operations' && pendingCount > 0 && (
                    <View style={nb.badge}>
                      <Text style={nb.badgeText}>
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </Text>
                    </View>
                  )}
                </View>
                {isFocused && (
                  <Text style={nb.label} numberOfLines={1}>
                    {t(`companyNavigation.${tab.name}`, { defaultValue: tab.label })}
                  </Text>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const nb = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingTop: 8,
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row', backgroundColor: NAV.bg, borderRadius: 32,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
      android: { elevation: 20 },
    }),
    borderWidth: 1, borderColor: NAV.border,
  },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 4 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 8, minWidth: 44 },
  iconWrapActive: { backgroundColor: NAV.pill, flexDirection: 'row', gap: 6, paddingHorizontal: 12, borderRadius: 20 },
  iconInner: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  label: { fontSize: 11, fontWeight: '700', color: NAV.active, letterSpacing: -0.2, flexShrink: 1 },
});

export default function CompanyTabsLayout() {
  const { t } = useTranslation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchPending = async () => {
      try {
        const res = await api.get('/api/bookings');
        const allBookings = res.data?.data?.bookings || res.data?.bookings || res.data?.data || [];
        const count = allBookings.filter((b: any) => b.status === 'pending').length;
        if (isMounted) setPendingCount(count);
      } catch {
        // silent fail on network hiccups
      }
    };

    fetchPending();
    const timer = setInterval(fetchPending, 12000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);
  
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} t={t} pendingCount={pendingCount} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="operations" />
      <Tabs.Screen name="staff" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="more" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
    </Tabs>
  );
}

