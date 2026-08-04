import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

const T = Theme.colors;

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  android: { elevation: 2 },
});

interface GuestCTAProps {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export function GuestCTA({ 
  title = "Log in required", 
  subtitle = "Please log in or create an account to access this feature.", 
  icon = "lock-outline" 
}: GuestCTAProps) {
  const router = useRouter();

  const handleLogin = () => {
    // Clear guest mode so they return to public routing cleanly
    useAuthStore.getState().setGuestMode(false);
    router.replace("/login");
  };

  return (
    <View style={s.container}>
      <View style={[s.card, CARD_SHADOW]}>
        <View style={s.iconWrapper}>
          <MaterialCommunityIcons name={icon} size={32} color={T.accent} />
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
        
        <Pressable onPress={handleLogin} style={s.btn}>
          <Text style={s.btnText}>Log in / Sign up</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: T.bg,
  },
  card: {
    backgroundColor: T.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: T.text1,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: T.text2,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  btn: {
    backgroundColor: T.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: T.surface,
    fontSize: 16,
    fontWeight: '600',
  }
});