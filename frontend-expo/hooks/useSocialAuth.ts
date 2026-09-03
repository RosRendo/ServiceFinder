import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import Toast from 'react-native-toast-message';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Safely attempt to load native modules (Google & Facebook)
// These custom native modules are present in Development Builds / Custom Binaries, but absent in standard Expo Go.
let GoogleSignin: any = null;
let statusCodes: any = {};
try {
  const gModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = gModule.GoogleSignin;
  statusCodes = gModule.statusCodes || {};
} catch (e) {
  // Native module unavailable (e.g. running in standard Expo Go client)
}

let LoginManager: any = null;
let AccessToken: any = null;
try {
  const fbModule = require('react-native-fbsdk-next');
  LoginManager = fbModule.LoginManager;
  AccessToken = fbModule.AccessToken;
} catch (e) {
  // Native module unavailable
}

export function useSocialAuth() {
  const { checkAuth, googleLogin, facebookLogin, appleLogin } = useAuthStore();
  const [isAppleReady, setIsAppleReady] = useState(false);

  useEffect(() => {
    // Configure Google Sign-In if native module is present
    if (GoogleSignin && typeof GoogleSignin.configure === 'function') {
      try {
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '', // From Google Console
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
          offlineAccess: true,
          scopes: ['profile', 'email'],
        });
      } catch (e) {
        console.warn('Failed to configure GoogleSignin', e);
      }
    }

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
    if (!GoogleSignin) {
      Toast.show({ type: 'info', text1: 'Development Build Needed', text2: 'Native Google Sign-In requires a custom development build (npx expo run:android).' });
      return;
    }
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
    if (!LoginManager || !AccessToken) {
      Toast.show({ type: 'info', text1: 'Development Build Needed', text2: 'Native Facebook Sign-In requires a custom development build.' });
      return;
    }
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
