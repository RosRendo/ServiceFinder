import React, { useRef, useEffect } from "react";
import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const NAV = {
  bg: '#FFFFFF',
  active: '#0A192F',
  inactive: '#94A3B8',
  pill: '#F0F4F8',
  border: '#E8EEF4',
};

const TABS = [
  { name: 'dashboard', icon: 'view-dashboard-outline',           iconActive: 'view-dashboard',           label: 'Dashboard' },
  { name: 'bookings',  icon: 'calendar-check-outline',           iconActive: 'calendar-check',           label: 'Bookings' },
  { name: 'staff',     icon: 'account-group-outline',            iconActive: 'account-group',            label: 'Staff' },
  { name: 'messages',  icon: 'message-outline',                  iconActive: 'message',                  label: 'Messages' },
  { name: 'more',      icon: 'dots-horizontal-circle-outline',   iconActive: 'dots-horizontal-circle',   label: 'More' },
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

export default function CompanyTabsLayout() {
  const { t } = useTranslation();
  
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} t={t} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="staff" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
