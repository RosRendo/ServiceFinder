import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

interface NotificationBellProps {
  color?: string;
}

export default function NotificationBell({ color = '#002045' }: NotificationBellProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications' as any)}
      className="relative p-2 active:scale-95"
    >
      <MaterialCommunityIcons name="bell-outline" size={24} color={color} />
      {unreadCount > 0 && (
        <View className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center border border-white">
          <Text className="text-white text-[9px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
