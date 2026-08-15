export default {
  "expo": {
    "name": "Service Finder",
    "slug": "frontend-expo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "servicefinder",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "jsEngine": "hermes",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.rendo.servicefinder",
      "buildNumber": "1",
      "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      },
      "config": {
        "googleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
      },
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "package": "com.rendo.servicefinder",
      "versionCode": 1,
      "config": {
        "googleMaps": {
          "apiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
        }
      },
      "googleServicesFile": "./google-services.json"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-font",
      "expo-asset",
      "expo-router",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff",
          "dark": {
            "backgroundColor": "#000000"
          }
        }
      ],
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      "expo-localization",
      "expo-notifications",
      "expo-apple-authentication",
      "@react-native-google-signin/google-signin",
      [
        "react-native-fbsdk-next",
        {
          "appID": process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "YOUR_FB_APP_ID",
          "clientToken": process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN || "YOUR_FB_CLIENT_TOKEN",
          "displayName": "Service Finder",
          "scheme": process.env.EXPO_PUBLIC_FACEBOOK_SCHEME || "fbYOUR_FB_APP_ID",
          "advertiserIDCollectionEnabled": false,
          "autoLogAppEventsEnabled": false,
          "isAutoInitEnabled": true,
          "iosUserTrackingPermission": "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    },
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/02f2b95a-56cb-42fe-b2a0-cf2e1d6acbfe"
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "02f2b95a-56cb-42fe-b2a0-cf2e1d6acbfe"
      }
    }
  }
};