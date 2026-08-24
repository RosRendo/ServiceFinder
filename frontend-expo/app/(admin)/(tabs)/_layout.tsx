import React, { useRef, useEffect } from "react";
import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const NAV = {
  bg: T.surface,
  active: T.primary,
  inactive: T.text3,
  pill: T.inputBg,
  border: T.border,
};

const TABS = [
  { name: 'dashboard', icon: 'view-dashboard-outline',  iconActive: 'view-dashboard',  label: 'Dashboard' },
  { name: 'users',     icon: 'account-group-outline',   iconActive: 'account-group',   label: 'Users' },
  { name: 'companies', icon: 'office-building-outline', iconActive: 'office-building', label: 'Companies' },
  { name: 'queue',     icon: 'clipboard-list-outline',  iconActive: 'clipboard-list',  label: 'Queue' },
  { name: 'settings',  icon: 'cog-outline',             iconActive: 'cog',             label: 'Settings' },
];

function FloatingTabBar({ state, descriptors, navigation, t }: any) {
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
                <MaterialCommunityIcons
                  name={(isFocused ? tab.iconActive : tab.icon) as any}
                  size={isFocused ? 24 : 22}
                  color={isFocused ? NAV.active : NAV.inactive}
                />
                {isFocused && <Text style={nb.label} numberOfLines={1}>{t(`adminNavigation.${tab.name}`)}</Text>}
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
    paddingHorizontal: 8, paddingVertical: 8, alignItems: 'center', gap: 2,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
      android: { elevation: 20 },
    }),
    borderWidth: 1, borderColor: NAV.border,
  },
  tab: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 4 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 6, minWidth: 40 },
  iconWrapActive: { backgroundColor: NAV.pill, flexDirection: 'row', gap: 4, paddingHorizontal: 10, borderRadius: 20 },
  label: { fontSize: 10, fontWeight: '700', color: NAV.active, letterSpacing: -0.2, flexShrink: 1 },
});

export default function AdminTabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} t={t} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="users" />
      <Tabs.Screen name="companies" />
      <Tabs.Screen name="queue" />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
