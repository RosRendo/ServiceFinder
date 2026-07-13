import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function PaymentForm() {
  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <MaterialCommunityIcons name="credit-card-outline" size={20} color="#191c1e" />
        <Text className="font-headline font-bold text-lg text-on-surface ml-2">Payment Details</Text>
      </View>
      
      <View className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant items-center justify-center">
        <MaterialCommunityIcons name="credit-card-off-outline" size={32} color="#74777f" />
        <Text className="text-on-surface-variant text-sm mt-2 text-center">
          Direct card payments are currently disabled. Please use alternative payment methods like ABA PayWay.
        </Text>
      </View>
    </View>
  );
}
