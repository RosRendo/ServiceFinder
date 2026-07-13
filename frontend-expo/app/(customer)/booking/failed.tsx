import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, ZoomIn, FadeInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle } from "react-native-reanimated";

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
    <View className="flex-1 bg-[#F9FAFB]">
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          
          {/* Epic Failure Visual */}
          <View className="items-center py-6 px-4 mb-8">
            <View className="relative items-center justify-center mb-6">
              <Animated.View 
                style={[pulseStyle, { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} 
              />
              
              <Animated.View 
                entering={ZoomIn.duration(800).springify()} 
                className="w-20 h-20 rounded-full bg-red-500 items-center justify-center z-10"
                style={{ shadowColor: '#EF4444'}}
              >
                <MaterialCommunityIcons name="close-thick" size={44} color="white" />
              </Animated.View>
            </View>
            
            <Animated.Text entering={FadeInUp.delay(300).duration(600)} className="text-3xl font-black text-[#0A2540] text-center mb-4 tracking-tight">
              Payment Failed
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(400).duration(600)} className="text-gray-500 text-center max-w-[280px] leading-5">
              {message || "We couldn't process your payment. Please check your card details and try again."}
            </Animated.Text>
          </View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(600).duration(800)} className="w-full gap-4">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.replace(`/(customer)/checkout?bookingId=${bookingId}` as any)}
              className="w-full bg-[#0A2540] rounded-2xl py-4 items-center flex-row justify-center"
              style={{ shadowColor: '#0A2540'}}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-black text-base uppercase tracking-wider">Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => router.push("/(customer)/(tabs)/home")}
              className="w-full bg-white rounded-2xl py-4 items-center border border-gray-200"
            >
              <Text className="text-[#0A2540] font-bold text-sm tracking-wide">Back to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
}
