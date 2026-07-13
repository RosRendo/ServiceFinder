import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { useAuthStore } from '@/store/authStore';
import api from '@/utils/api';
import Toast from 'react-native-toast-message';

// WebBrowser must be configured for AuthSession to work
WebBrowser.maybeCompleteAuthSession();

export function useSocialAuth() {
  const { checkAuth } = useAuthStore();

  // Google Provider
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'YOUR_IOS_CLIENT_ID',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'YOUR_ANDROID_CLIENT_ID',
  });

  // Facebook Provider
  const [facebookRequest, facebookResponse, promptFacebookAsync] = Facebook.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
  });

  // Handle Google Auth Response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      if (authentication?.idToken) {
        handleBackendLogin('google', authentication.idToken);
      } else if (authentication?.accessToken) {
        // Fallback for access token if idToken is unavailable
        handleBackendLogin('google', authentication.accessToken);
      }
    } else if (googleResponse?.type === 'error') {
      Toast.show({
        type: 'error',
        text1: 'Google Login Failed',
        text2: googleResponse.error?.message || 'An unknown error occurred.',
      });
    }
  }, [googleResponse]);

  // Handle Facebook Auth Response
  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      const { authentication } = facebookResponse;
      if (authentication?.accessToken) {
        handleBackendLogin('facebook', authentication.accessToken);
      }
    } else if (facebookResponse?.type === 'error') {
      Toast.show({
        type: 'error',
        text1: 'Facebook Login Failed',
        text2: facebookResponse.error?.message || 'An unknown error occurred.',
      });
    }
  }, [facebookResponse]);

  const handleBackendLogin = async (provider: 'google' | 'facebook', token: string) => {
    try {
      // Choose endpoint
      const endpoint = provider === 'google' ? '/api/auth/google' : '/api/auth/facebook';
      
      const res = await api.post(endpoint, { token });
      
      // If backend returns a token, we successfully authenticated
      if (res.data?.token) {
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: 'Successfully logged in with ' + (provider === 'google' ? 'Google' : 'Facebook'),
        });
        
        // This will fetch user/me and update the Zustand auth store
        await checkAuth();
      }
    } catch (error: any) {
      console.error(`${provider} backend login error:`, error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.response?.data?.message || `Failed to authenticate with ${provider}`,
      });
    }
  };

  return {
    promptGoogleAsync,
    isGoogleReady: !!googleRequest,
    promptFacebookAsync,
    isFacebookReady: !!facebookRequest,
  };
}
