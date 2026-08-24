import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, ZoomIn, FadeInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

const BUTTON_SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  android: { elevation: 3 },
});

export default function PaymentFailedScreen() {
  const router = useRouter();
  const { bookingId, message } = useLocalSearchParams<{ bookingId: string, message: string }>();

  // Pulsing error glow
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1.3, { duration: 1500 }), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 1 - (pulse.value - 1) * 2
  }));

  return (
    <View style={s.root}>
      <SafeAreaView style={s.safeArea}>
        <View style={s.content}>
          
          {/* Epic Failure Visual */}
          <View style={s.visualWrap}>
            <View style={s.iconContainer}>
              <Animated.View 
                style={[pulseStyle, s.pulseGlow]} 
              />
              
              <Animated.View 
                entering={ZoomIn.duration(800).springify()} 
                style={[s.iconBg, { shadowColor: T.error }]}
              >
                <MaterialCommunityIcons name="close-thick" size={44} color="white" />
              </Animated.View>
            </View>
            
            <Animated.Text entering={FadeInUp.delay(300).duration(600)} style={s.title}>
              Payment Failed
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(400).duration(600)} style={s.desc}>
              {message || "We couldn't process your payment. Please check your card details and try again."}
            </Animated.Text>
          </View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={s.btnGroup}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.replace(`/(customer)/checkout?bookingId=${bookingId}` as any)}
              style={[s.primaryBtn, BUTTON_SHADOW]}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="white" style={s.btnIcon} />
              <Text style={s.primaryBtnText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => router.push("/(customer)/(tabs)/home")}
              style={s.secondaryBtn}
            >
              <Text style={s.secondaryBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  visualWrap: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulseGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.error,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: T.primary,
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  desc: {
    fontSize: 15,
    color: T.text2,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
    fontWeight: "500",
  },
  btnGroup: {
    width: "100%",
    gap: 16,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: T.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  btnIcon: {
    marginRight: 8,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  secondaryBtn: {
    width: "100%",
    backgroundColor: T.surface,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: T.border,
  },
  secondaryBtnText: {
    color: T.primary,
    fontWeight: "800",
    fontSize: 15,
  },
});
