/**
 * Staff Bottom Tab Layout — Floating Pill Navigation
 * Clean iOS-style tab bar that floats above content with a pill indicator
 */
import React, { useRef, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";

const NAV = {
  bg: '#FFFFFF',
  active: '#0A192F',
  inactive: '#94A3B8',
  pill: '#F0F4F8',
  border: '#E8EEF4',
};

const TABS = [
  { name: 'today', icon: 'lightning-bolt-outline', iconActive: 'lightning-bolt', label: 'Today' },
  { name: 'money', icon: 'currency-usd', iconActive: 'currency-usd', label: 'Money' },
  { name: 'me',    icon: 'account-outline', iconActive: 'account', label: 'Profile' },
];

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  // One animated value per tab for the scale spring
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
          const route = state.routes[index];
          if (!route) return null;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation?.emit
              ? navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
              : null;
            if (!isFocused && (!event || !event.defaultPrevented)) {
              if (navigation?.navigate) {
                navigation.navigate(route.name);
              } else {
                router.push(`/(staff)/(tabs)/${route.name}` as any);
              }
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
                {isFocused && <Text style={nb.label}>{tab.label}</Text>}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingTop: 8,
    pointerEvents: 'box-none',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: NAV.bg,
    borderRadius: 32,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
    // Premium shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 20 },
    }),
    // Subtle border
    borderWidth: 1,
    borderColor: NAV.border,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minWidth: 44,
  },
  iconWrapActive: {
    backgroundColor: NAV.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: NAV.active,
    letterSpacing: -0.2,
  },
});

export default function StaffTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="today" options={{ title: 'TODAY' }} />
      <Tabs.Screen name="money" options={{ title: 'MONEY' }} />
      <Tabs.Screen name="me"    options={{ title: 'ME' }} />
    </Tabs>
  );
}