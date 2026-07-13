import { Platform } from 'react-native';
// IMPORT AFTER RUNNING: npx expo install expo-notifications expo-device
// import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications';
import api from './api';

/*
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
*/

export async function registerForPushNotificationsAsync() {
  /*
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }
    
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with Constants.expoConfig?.extra?.eas?.projectId
    })).data;
    
    // Optional: send token to backend
    // try {
    //   await api.post('/api/users/push-token', { token });
    // } catch (e) {
    //   console.error("Failed to register push token with backend", e);
    // }
    
  } else {
  }

  return token;
  */
  return null;
}
