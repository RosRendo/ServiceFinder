import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Toast from 'react-native-toast-message';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { Platform } from 'react-native';

export function useSocialAuth() {
  const { checkAuth, googleLogin, facebookLogin, appleLogin } = useAuthStore();
  const [isAppleReady, setIsAppleReady] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '', // From Google Console
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
      offlineAccess: true,
      scopes: ['profile', 'email'],
    });

    // Check Apple Sign-In availability
    const checkApple = async () => {
      if (Platform.OS === 'ios') {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAppleReady(available);
      }
    };
    checkApple();
  }, []);

  const promptGoogleAsync = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      if (tokens.idToken) {
        await googleLogin(tokens.idToken);
        Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Successfully logged in with Google' });
        await checkAuth();
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation already in progress
      } else {
        Toast.show({ type: 'error', text1: 'Google Login Failed', text2: error.message || 'An error occurred' });
      }
    }
  };

  const promptFacebookAsync = async () => {
    try {
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) {
        // User cancelled
      } else {
        const data = await AccessToken.getCurrentAccessToken();
        if (data && data.accessToken) {
          await facebookLogin(data.accessToken.toString());
          Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Successfully logged in with Facebook' });
          await checkAuth();
        }
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Facebook Login Failed', text2: error.message || 'An error occurred' });
    }
  };

  const promptAppleAsync = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      if (credential.identityToken) {
        await appleLogin(
          credential.identityToken, 
          credential.fullName ? { 
            givenName: credential.fullName.givenName || undefined, 
            familyName: credential.fullName.familyName || undefined 
          } : undefined
        );
        Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Successfully logged in with Apple' });
        await checkAuth();
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled
      } else {
        Toast.show({ type: 'error', text1: 'Apple Login Failed', text2: e.message || 'An error occurred' });
      }
    }
  };

  return {
    promptGoogleAsync,
    isGoogleReady: true, // Native SDK is generally always ready, though Play Services check handles Android
    promptFacebookAsync,
    isFacebookReady: true,
    promptAppleAsync,
    isAppleReady,
  };
}
