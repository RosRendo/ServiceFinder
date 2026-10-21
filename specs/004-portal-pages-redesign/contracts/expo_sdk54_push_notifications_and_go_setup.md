# Architecture & Troubleshooting: Expo SDK 54 Push Notifications & Expo Go Setup

**Date**: 2026-10-04  
**Module**: `frontend-expo` (Expo SDK 54, React Native 0.76+)  
**App**: Service Finder Mobile  

---

## 1. Problem Breakdown

### 1.1. Expo Go Version Mismatch & `TypeError: fetch failed`
* **Symptom**: When downgrading Expo Go from 57.0.9 to 54.0.8 on the Android emulator, Expo CLI uninstalled the app, then threw `TypeError: fetch failed`.
* **Root Cause**: Node's internal fetch (Undici) dropped the connection during the direct download of the 185 MB `Expo-Go-54.0.8.apk` binary from GitHub Releases / S3.
* **Resolution**:
  1. Download the APK directly via `curl -L --retry 3` to Expo's local cache:
     `~/.expo/android-apk-cache/Expo-Go-54.0.8.apk`
  2. Install via ADB:
     `adb install -r Expo-Go-54.0.8.apk`
  3. Reverse Metro port:
     `adb reverse tcp:8081 tcp:8081`

### 1.2. `ERROR expo-notifications: Android Push notifications removed from Expo Go in SDK 53`
* **Root Cause**: Due to Google FCM legacy API deprecations, Expo removed remote push notification support from the generic Expo Go Android client starting in SDK 53.
* **Failure Trigger**:
  - Simply importing `expo-notifications` evaluates `DevicePushTokenAutoRegistration.fx.js`, which invokes `warnOfExpoGoPushUsage()`.
  - On Android in Expo Go, Expo executes `console.error(message)`, which React Native LogBox interprets as a fatal RedBox error.
  - Hooks like `usePushNotifications` and `useRealtimeNotifications` attempted to fetch FCM tokens via `getExpoPushTokenAsync`.

---

## 2. Architectural Solution

### 2.1. Environment-Aware Push Notification Guards
Guarded all remote push token registration and FCM listener bindings with `isRunningInExpoGo()` from `expo`:
1. **`useRealtimeNotifications.ts`**:
   - If `isRunningInExpoGo()` is true, skip `registerForPushNotifications`.
   - Preserve Socket.io connection and local foreground notifications (`scheduleNotificationAsync` continues to work in Expo Go).
2. **`usePushNotifications.ts`**:
   - Exit early from `useEffect` and `registerForPushNotificationsAsync` when running in Expo Go.

### 2.2. LogBox and Console Error Filtering
In `app/_layout.tsx`:
- Added `LogBox.ignoreLogs` for `expo-notifications: Android Push notifications`.
- Intercepted `console.error` to demote this specific informational message to `console.warn` so Metro LogBox does not trigger a blocking RedBox modal on developers' screens.

---

## 3. Production vs Development Strategy

| Feature | Expo Go (Development) | Development Build / Production APK |
| :--- | :--- | :--- |
| **Realtime Updates** | Socket.io WebSockets (Full support) | Socket.io WebSockets (Full support) |
| **Local In-App Banners** | `scheduleNotificationAsync` (Supported) | `scheduleNotificationAsync` (Supported) |
| **Remote Push (FCM / APNs)** | Disabled gracefully | Enabled via `google-services.json` and EAS build |
