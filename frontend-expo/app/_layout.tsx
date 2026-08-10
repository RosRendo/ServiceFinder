// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "../global.css";
import '@/utils/i18n';
import { Platform, Text, TextInput } from 'react-native';

import {
  useFonts,
  KantumruyPro_400Regular,
  KantumruyPro_500Medium,
  KantumruyPro_600SemiBold,
  KantumruyPro_700Bold,
} from '@expo-google-fonts/kantumruy-pro';


import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/authStore';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import Toast from 'react-native-toast-message';
import { OfflineNotice } from '@/components/common/OfflineNotice';
import * as Sentry from '@sentry/react-native';
import { PostHogProvider } from 'posthog-react-native';

// Suppress defaultProps warning since it's the most reliable global font hack in RN
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('defaultProps will be removed')) {
    return;
  }
  originalConsoleError(...args);
};

if (!(Text as any).defaultProps) (Text as any).defaultProps = {};
(Text as any).defaultProps.style = { fontFamily: 'KantumruyPro-Regular' };
if (!(TextInput as any).defaultProps) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.style = { fontFamily: 'KantumruyPro-Regular' };

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "https://688d3cbe50b27f2509ee7fd9ac59b6bf@o4511473384030208.ingest.us.sentry.io/4511473386651649",
  debug: false,
});

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const colorScheme = useColorScheme();
  const { user, isGuest, isLoading, checkAuth, hasSeenOnboarding } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    'KantumruyPro-Regular': KantumruyPro_400Regular,
    'KantumruyPro-Medium': KantumruyPro_500Medium,
    'KantumruyPro-SemiBold': KantumruyPro_600SemiBold,
    'KantumruyPro-Bold': KantumruyPro_700Bold,
  });

  // Connect Socket.io + push notifications once authenticated
  useRealtimeNotifications();
  usePushNotifications();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is already logged in
        await checkAuth();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  const router = useRouter();
  const segments = useSegments();
  useEffect(() => {
    if (appReady && !isLoading && !user && !isGuest) {
      // Avoid forcing redirect if the user is explicitly navigating to a public subpage (e.g. login, register)
      const isPublicSubpage = segments[0] === '(public)' && segments.length > 1;
      if (!isPublicSubpage) {
        if (hasSeenOnboarding) {
          router.replace("/(public)/login");
        } else {
          router.replace("/");
        }
      }
    }
  }, [user, isGuest, appReady, isLoading, segments, hasSeenOnboarding]);

  if (!appReady || isLoading || !fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
        {!user && !isGuest ? (
          <Stack.Screen name="(public)" options={{ gestureEnabled: false }} />
        ) : user?.role?.toLowerCase() === 'admin' ? (
          <Stack.Screen name="(admin)" options={{ gestureEnabled: false }} />
        ) : (user?.role?.toLowerCase() === 'company' || user?.role?.toLowerCase() === 'company_admin') ? (
          <Stack.Screen name="(company)" options={{ gestureEnabled: false }} />
        ) : user?.role?.toLowerCase() === 'staff' ? (
          <Stack.Screen name="(staff)" options={{ gestureEnabled: false }} />
        ) : (
          <Stack.Screen name="(customer)" options={{ gestureEnabled: false }} />
        )}
        </Stack>
        <StatusBar style="auto" />
        <OfflineNotice />
        <Toast />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

function App() {
  return (
    <PostHogProvider 
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "phc_placeholder_key_replace_me"}
      options={{
        host: process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      }}
    >
      <RootLayout />
    </PostHogProvider>
  );
}

export default Sentry.wrap(App);