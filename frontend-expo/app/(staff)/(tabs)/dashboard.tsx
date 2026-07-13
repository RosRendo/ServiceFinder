import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, Switch, ScrollView,
  ActivityIndicator, StyleSheet, Platform, Animated, PanResponder, Alert, RefreshControl, Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { api, useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import FadeIn from "@/components/FadeIn";
import ScaleButton from "@/components/ScaleButton";
import { WebView } from "react-native-webview";
import MapView, { Marker } from "react-native-maps";
import * as ExpoLocation from "expo-location";
import { useTranslation } from "react-i18next";

import { Theme } from "@/constants/theme";

// Clean, Premium Theme Colors
const T = {
  bg: Theme.colors.bg,
  surface: Theme.colors.surface,
  primary: Theme.colors.primary,
  primaryLight: Theme.colors.primaryLight,
  text: Theme.colors.text,
  textMuted: Theme.colors.textMuted,
  border: Theme.colors.border,
  success: Theme.colors.success,
  successLight: Theme.colors.successBg,
  error: Theme.colors.error,
  errorBg: Theme.colors.errorBg,
  accent: Theme.colors.accent,
};

const SHADOW = Platform.select({
  ios: { shadowColor: '#0A192F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
  android: { elevation: 4 },
});

const CARD_SHADOW = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

// ── Skeleton Bone ─────────────────────────────────────────────────────────────
function SkeletonBone({ width, height, radius = 8, style }: { width: number | string; height: number; radius?: number; style?: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: '#CBD5E1', opacity }, style]} />;
}

// ── Animated Empty State Character ────────────────────────────────────────────
function IdleStaffCharacter() {
  const bounce = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 900, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(wave, { toValue: -1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const rotate = wave.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] });
  return (
    <Animated.View style={{ alignItems: 'center', transform: [{ translateY: bounce }] }}>
      {/* Simple SVG-style person using Views */}
      <View style={{ alignItems: 'center' }}>
        {/* Head */}
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FCD34D', borderWidth: 3, borderColor: '#F59E0B', marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
          {/* Eyes */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#1E293B' }} />
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#1E293B' }} />
          </View>
          {/* Smile */}
          <View style={{ width: 20, height: 10, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 2, borderTopWidth: 0, borderColor: '#1E293B' }} />
        </View>
        {/* Body */}
        <View style={{ width: 64, height: 52, borderRadius: 16, backgroundColor: T.primary, marginBottom: 4, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="briefcase-outline" size={24} color="#fff" />
        </View>
        {/* Waving arm */}
        <Animated.View style={{ position: 'absolute', right: -20, top: 60, transform: [{ rotate }] }}>
          <View style={{ width: 12, height: 36, borderRadius: 6, backgroundColor: T.primary, transformOrigin: 'top' }} />
        </Animated.View>
        {/* Legs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ width: 16, height: 32, borderRadius: 8, backgroundColor: '#475569' }} />
          <View style={{ width: 16, height: 32, borderRadius: 8, backgroundColor: '#475569' }} />
        </View>
      </View>
    </Animated.View>
  );
}

export default function StaffDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  useRealtimeNotifications();

  const setStaffOpen = useSidebarStore((s) => s.setStaffOpen);
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwiping, setIsSwiping] = useState(false);
  const [earned, setEarned] = useState<number>(0);
  const [wallet, setWallet] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(0);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
          setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      } catch (e) {}
    })();
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, payoutsRes] = await Promise.all([
        api.get('/api/bookings/my-assignments', { params: { limit: 100 } }),
        api.get("/api/staff/payouts"),
      ]);
      const payoutsData = payoutsRes.data?.data || payoutsRes.data || {};
      setBookings(bookingsRes.data?.bookings || bookingsRes.data?.data?.bookings || bookingsRes.data || []);
      setEarned(Number(payoutsData.availableBalance || 0));

      if (!user?.staffProfile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const walletRes = await api.get("/api/wallets/staff/" + user.staffProfile.id);
        const walletData = walletRes.data?.data || walletRes.data || {};
        setWallet(Number(walletData.balance || walletData.walletBalance || 0));
        setCreditLimit(Number(walletData.creditLimit || 0));
      } catch (e: any) {
        console.warn("Wallet data not available", e.response?.data || e.message);
      }
    } catch (e: any) {
      console.error("Failed to fetch dashboard data", e.response?.data || e.message);
      Alert.alert(t('staffDashboard.dashboardError'), t('staffDashboard.couldNotFetch', { msg: e.response?.data?.message || e.message }));
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.id) fetchDashboardData();
    }, [user?.id, user?.staffProfile?.id])
  );

  const handleStatusChange = async (val: boolean) => {
    setIsOnline(val);
    try {
      await api.patch('/api/users/me/staff-status', { status: val ? 'active' : 'inactive' });
    } catch (e) {
      console.error("Failed to update staff status", e);
      setIsOnline(!val);
    }
  };

  const handleDeclineJob = (jobId: string) => {
    Alert.alert(
      t('staffDashboard.declineJob'),
      t('staffDashboard.declineConfirmMsg'),
      [
        { text: t('staffDashboard.keepJob'), style: "cancel" },
        { 
          text: t('staffDashboard.decline'), 
          style: "destructive",
          onPress: async () => {
            try {
              await api.patch(`/api/bookings/${jobId}/status`, { status: "CANCELLED" });
              setBookings(prev => prev.filter(b => b.id !== jobId));
            } catch (err) {
              console.error("Failed to decline job", err);
              Alert.alert(t('staffDashboard.error'), t('staffDashboard.declineErrorMsg'));
            }
          }
        }
      ]
    );
  };

  // Generate the next 14 days for the horizontal calendar strip
  const upcomingDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: i === 0
    };
  });

  const dailyJobs = bookings.filter(b => {
    if (!['pending', 'confirmed', 'in_progress'].includes(b.status)) return false;
    const dStr = b.bookingDate ? (typeof b.bookingDate === 'string' ? b.bookingDate.split('T')[0] : new Date(b.bookingDate).toISOString().split('T')[0]) : '';
    return dStr === selectedDate;
  }).sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());

  const renderJobCard = (job: any, index?: number) => {
    const timeString = new Date(job.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const content = (
      <View style={s.jobCard}>
        <View style={s.jobCardTop}>
        {/* Left: Time & ID */}
        <View style={s.jobTimeArea}>
          <Text style={s.jobTime}>{timeString}</Text>
          <Text style={s.jobId}>#{job.id.toString().padStart(6, '0')}</Text>
        </View>
        
        {/* Right: Details */}
        <View style={s.jobDetailsArea}>
          <View style={s.jobTitleRow}>
            <Text style={s.jobService} numberOfLines={1}>{job.service?.name || t('staffDashboard.serviceTask')}</Text>
            <View style={s.badge}>
              <Text style={s.badgeText}>{job.status}</Text>
            </View>
          </View>
          
          <View style={s.customerRow}>
            <View style={s.customerAvatarWrap}>
              <MaterialCommunityIcons name="account-circle" size={24} color={T.textMuted} />
            </View>
            <Text style={s.customerName} numberOfLines={1}>{job.customer?.fullName || t('staffDashboard.customer')}</Text>
          </View>

          <View style={s.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={T.textMuted} />
            <Text style={s.locationText} numberOfLines={1}>{job.serviceAddress || t('staffDashboard.customerLocation')}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={s.jobCardActions}>
        <TouchableOpacity 
          style={s.iconActionBtn}
          onPress={() => {
            const { Linking } = require('react-native');
            if (job.latitude && job.longitude) {
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`);
            } else if (job.serviceAddress) {
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.serviceAddress)}`);
            }
          }}
        >
          <MaterialCommunityIcons name="navigation-variant-outline" size={20} color={T.primary} />
          <Text style={s.iconActionText}>{t('staffDashboard.navigate')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={s.iconActionBtn}
          onPress={() => router.push(`/(staff)/job/${job.id}` as any)}
        >
          <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={T.primary} />
          <Text style={s.iconActionText}>{t('staffDashboard.details')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={s.declineLinkBtn}
        onPress={() => handleDeclineJob(job.id)}
      >
        <Text style={s.declineLinkText}>{t('staffDashboard.decline')}</Text>
      </TouchableOpacity>

      {/* Swipe to Start or Resume */}
      <View style={s.fullSwipeWrap}>
        {job.paymentMethod === 'cash' && wallet <= creditLimit ? (
          <View style={{ backgroundColor: T.errorBg, padding: 16, borderRadius: 16, alignItems: 'center' }}>
            <Text style={{ color: T.error, fontWeight: '700', fontSize: 13, textAlign: 'center' }}>
              {t('staffDashboard.actionBlocked')}
            </Text>
          </View>
        ) : job.status === 'in_progress' ? (
          <ScaleButton 
            onPress={() => router.push(`/(staff)/job/${job.id}/execution` as any)}
          >
            <View style={{ backgroundColor: T.accent, padding: 16, borderRadius: 16, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t('staffDashboard.resumeExecution')}</Text>
            </View>
          </ScaleButton>
        ) : (
          <SwipeButton 
            title={t('staffDashboard.swipeToStart')} 
            onComplete={async () => {
              try {
                await api.patch(`/api/bookings/${job.id}/start`);
                setBookings(prev => prev.map(b => b.id === job.id ? { ...b, status: 'in_progress' } : b));
                router.push(`/(staff)/job/${job.id}/execution` as any);
              } catch (err) {
                Alert.alert(t('staffDashboard.error'), t('staffDashboard.startError'));
              }
            }} 
            onSwipeStart={() => setIsSwiping(true)}
            onSwipeEnd={() => setIsSwiping(false)}
          />
        )}
      </View>
    </View>
    );

    if (index !== undefined) {
      return <FadeIn key={job.id} delay={index * 100}>{content}</FadeIn>;
    }
    return <View key={job.id}>{content}</View>;
  };

  // Custom Robust Swipe to Accept Component
  const buildMapHTML = (jobs: any[], userLocation: {lat: number, lng: number} | null) => {
    const firstMapJob = jobs.find(j => j.latitude && j.longitude);
    const centerLat = firstMapJob ? Number(firstMapJob.latitude) : 3.147;
    const centerLng = firstMapJob ? Number(firstMapJob.longitude) : 101.6938;

    const markersJS = jobs
      .filter(j => j.latitude && j.longitude)
      .map(
        (p) => {
          const timeString = p.bookingDate ? new Date(p.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD";
          return `
          {
            id: ${JSON.stringify(p.id)},
            lat: ${p.latitude},
            lng: ${p.longitude},
            label: ${JSON.stringify(p.customer?.fullName ? p.customer.fullName.charAt(0).toUpperCase() : "C")},
            customerName: ${JSON.stringify(p.customer?.fullName || "Customer")},
            serviceName: ${JSON.stringify(p.service?.name || "Service Task")},
            time: ${JSON.stringify(timeString)},
            status: ${JSON.stringify(p.status)}
          }
        `}
      )
      .join(",");

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; overflow: hidden; background: ${T.bg}; }
      #map { width: 100%; height: 100%; }
      .pin-marker {
        width: 36px; height: 36px;
        background: ${T.accent};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: bold; color: white;
        font-family: -apple-system, system-ui, sans-serif;
      }
      .pin-inner { transform: rotate(45deg); }
      .custom-popup .leaflet-popup-content-wrapper {
        border-radius: 12px;
        padding: 0;
        overflow: hidden;
        border: 1px solid #EBEBEB;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .custom-popup .leaflet-popup-content {
        margin: 0;
        width: 220px !important;
      }
      .popup-body {
        padding: 16px;
        font-family: -apple-system, system-ui, sans-serif;
        text-align: center;
      }
      .popup-service { font-weight: 800; font-size: 15px; color: ${T.primary}; margin-bottom: 4px; }
      .popup-customer { font-size: 13px; color: ${T.textMuted}; margin-bottom: 4px; font-weight: 600; }
      .popup-time { font-size: 12px; color: ${T.accent}; font-weight: 700; margin-bottom: 12px; }
      .popup-btn {
        background: ${T.primary};
        color: white;
        border: none;
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors',
        subdomains: 'abcd', maxZoom: 20
      }).addTo(map);

      function send(type, payload) {
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
          }
        } catch(e) {}
      }

      let suppressMapClick = false;

      const pins = [${markersJS}];
      
      ${userLocation ? `
        const userIcon = L.divIcon({
          className: '',
          html: '<div style="width:16px;height:16px;background:#1D4ED8;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.marker([${userLocation.lat}, ${userLocation.lng}], { icon: userIcon, zIndexOffset: 1000 }).addTo(map).bindPopup("${t('staffDashboard.youAreHere')}");
        pins.push({ lat: ${userLocation.lat}, lng: ${userLocation.lng} }); // add to bounds
      ` : ''}

      if (pins.length > 0) {
        const bounds = L.latLngBounds(pins.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (${userLocation ? 'true' : 'false'}) {
        map.setView([${userLocation?.lat || 0}, ${userLocation?.lng || 0}], 13);
      }

      pins.forEach(p => {
        const icon = L.divIcon({
          className: '',
          html: '<div class="pin-marker"><span class="pin-inner">' + p.label + '</span></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36],
        });

        const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
        marker.on('click', e => {
          L.DomEvent.stopPropagation(e);
          map.flyTo([p.lat, p.lng], 15, { animate: true, duration: 0.5 });
          send('markerPress', p.id);
        });
      });

      map.on('click', () => {
        send('mapPress', null);
      });
    </script>
  </body>
</html>`;
  };

  const SwipeButton = ({ title, onComplete, onSwipeStart, onSwipeEnd }: { 
    title: string; 
    onComplete: () => void; 
    onSwipeStart?: () => void;
    onSwipeEnd?: () => void;
  }) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const containerWidthRef = useRef(0);
    const pan = useRef(new Animated.ValueXY()).current;
    const sliderWidth = 56;

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: () => {
          if (onSwipeStart) onSwipeStart();
        },
        onPanResponderMove: (_, gestureState) => {
          let newX = gestureState.dx;
          if (newX < 0) newX = 0;
          const cw = containerWidthRef.current;
          if (cw > 0 && newX > cw - sliderWidth) {
            newX = cw - sliderWidth;
          }
          pan.setValue({ x: newX, y: 0 });
        },
        onPanResponderRelease: (_, gestureState) => {
          if (onSwipeEnd) onSwipeEnd();
          const cw = containerWidthRef.current;
          if (cw > 0 && gestureState.dx > (cw - sliderWidth) * 0.75) {
            Animated.timing(pan, {
              toValue: { x: cw - sliderWidth, y: 0 },
              duration: 150,
              useNativeDriver: false,
            }).start(() => {
              onComplete();
              setTimeout(() => pan.setValue({ x: 0, y: 0 }), 500);
            });
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: false,
            }).start();
          }
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          if (onSwipeEnd) onSwipeEnd();
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      })
    ).current;

    return (
      <View 
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setContainerWidth(w);
          containerWidthRef.current = w;
        }} 
        style={s.swipeContainer}
      >
        <Text style={s.swipeText}>{title}</Text>
        <Animated.View style={[s.swipeFill, { width: Animated.add(pan.x, sliderWidth) }]} />
        <Animated.View {...panResponder.panHandlers} style={[s.swipeHandle, { transform: [{ translateX: pan.x }] }]}>
          <MaterialCommunityIcons name="chevron-double-right" size={30} color="#FFF" />
        </Animated.View>
      </View>
    );
  };

  if (!user?.staffProfile?.id) {
    return (
      <SafeAreaView style={s.root}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <MaterialCommunityIcons name="account-alert" size={60} color={T.textMuted} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: "bold", color: T.text, marginBottom: 8 }}>
            {t('staffDashboard.noCompanyAssigned')}
          </Text>
          <Text style={{ fontSize: 14, color: T.textMuted, textAlign: "center" }}>
            {t('staffDashboard.noCompanyMsg', { email: user?.email })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView edges={['top']} style={s.root}>
        
      <View style={s.headerRow}>
          <View style={s.headerInfo}>
            <Text style={s.headerGreeting}>{(() => {
              const h = new Date().getHours();
              if (h < 12) return '☀️ Good morning,';
              if (h < 18) return '⛅ Good afternoon,';
              return '🌙 Good evening,';
            })()}</Text>
            <Text style={s.headerName} numberOfLines={1}>{user?.name?.split(' ')[0] || 'Staff'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleStatusChange(!isOnline)}
              style={[s.statusPill, { backgroundColor: isOnline ? T.successLight : '#F1F5F9', borderColor: isOnline ? T.success : T.border }]}
            >
              <View style={[s.statusDot, { backgroundColor: isOnline ? T.success : T.textMuted }]} />
              <Text style={[s.statusText, { color: isOnline ? T.success : T.textMuted }]}>
                {isOnline ? t('staffDashboard.online') : t('staffDashboard.offline')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStaffOpen(true)} style={s.avatarBtn}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarInitial}>{(user?.name?.[0] || 'S').toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {(viewMode as any) === "map" ? (
          <View style={s.fullMapContainer}>
            {process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <MapView
                style={{ flex: 1 }}
                showsUserLocation={true}
                initialRegion={{
                  latitude: dailyJobs.length > 0 && dailyJobs[0].latitude ? Number(dailyJobs[0].latitude) : 3.147,
                  longitude: dailyJobs.length > 0 && dailyJobs[0].longitude ? Number(dailyJobs[0].longitude) : 101.6938,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                ref={(ref) => {
                  const mapJobs = dailyJobs.filter(j => j.latitude && j.longitude);
                  if (ref && mapJobs.length > 0) {
                    setTimeout(() => {
                      const coords = mapJobs.map(j => ({ latitude: Number(j.latitude), longitude: Number(j.longitude) }));
                      if (userLoc) coords.push({ latitude: userLoc.lat, longitude: userLoc.lng });
                      ref.fitToCoordinates(
                        coords,
                        { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: false }
                      );
                    }, 100);
                  } else if (ref && userLoc) {
                    setTimeout(() => {
                      ref.animateToRegion({ latitude: userLoc.lat, longitude: userLoc.lng, latitudeDelta: 0.1, longitudeDelta: 0.1 });
                    }, 100);
                  }
                }}
                onPress={() => setSelectedJobId(null)}
              >
                {dailyJobs.filter(j => j.latitude && j.longitude).map(p => (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: Number(p.latitude), longitude: Number(p.longitude) }}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedJobId(p.id);
                    }}
                  >
                    <View style={s.nativeMarkerBox}>
                      <Text style={s.nativeMarkerText}>{p.customer?.fullName ? p.customer.fullName.charAt(0).toUpperCase() : "C"}</Text>
                    </View>
                  </Marker>
                ))}
              </MapView>
            ) : (
              <WebView
                originWhitelist={['*']}
                source={{ html: buildMapHTML(dailyJobs, userLoc) }}
                style={{ flex: 1 }}
                scrollEnabled={false}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === "markerPress") {
                      setSelectedJobId(data.payload);
                    } else if (data.type === "mapPress") {
                      setSelectedJobId(null);
                    }
                  } catch {}
                }}
              />
            )}
            {/* Floating Toggle */}
            <View style={s.floatingToggle}>
              <TouchableOpacity 
                style={[s.viewToggleBtn, (viewMode as any) === "list" && s.viewToggleBtnActive]}
                onPress={() => { setViewMode("list"); setSelectedJobId(null); }}
              >
                <MaterialCommunityIcons name="format-list-bulleted" size={16} color={(viewMode as any) === "list" ? "#FFF" : T.primary} />
                <Text style={[s.viewToggleText, (viewMode as any) === "list" && s.viewToggleTextActive, { color: (viewMode as any) === "list" ? "#FFF" : T.primary }]}>{t('staffDashboard.list')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.viewToggleBtn, (viewMode as any) === "map" && s.viewToggleBtnActive]}
                onPress={() => setViewMode("map")}
              >
                <MaterialCommunityIcons name="map-outline" size={16} color={(viewMode as any) === "map" ? "#FFF" : T.primary} />
                <Text style={[s.viewToggleText, (viewMode as any) === "map" && s.viewToggleTextActive, { color: (viewMode as any) === "map" ? "#FFF" : T.primary }]}>{t('staffDashboard.map')}</Text>
              </TouchableOpacity>
            </View>

            {/* Floating Job Card */}
            {selectedJobId && (
              <View style={s.floatingCardWrapper}>
                {dailyJobs.filter(j => j.id === selectedJobId).map(job => renderJobCard(job))}
              </View>
            )}
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={s.scrollContent}
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={fetchDashboardData} tintColor={T.primary} />
            }
          >
            {/* Performance & Metrics */}
            <View style={s.metricsContainer}>
              <View style={s.metricBox}>
                <Text style={s.metricLabel}>{t('staffDashboard.todaysEarnings')}</Text>
                <Text style={s.metricValue}>${earned.toFixed(2)}</Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metricBox}>
                <Text style={s.metricLabel}>{t('staffDashboard.totalJobs')}</Text>
                <Text style={s.metricValue}>{bookings.length}</Text>
              </View>
              <View style={s.metricDivider} />
              <View style={s.metricBox}>
                <Text style={s.metricLabel}>{t('staffDashboard.wallet')}</Text>
                <Text style={[s.metricValue, { color: wallet < 0 ? T.error : T.primary }]}>
                  ${Number(wallet).toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Horizontal Calendar Strip */}
            <View style={s.calendarContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.calendarScroll}>
                {upcomingDays.map((day) => {
                  const isSelected = selectedDate === day.dateStr;
                  return (
                    <TouchableOpacity
                      key={day.dateStr}
                      style={[s.dateBox, isSelected && s.dateBoxSelected]}
                      onPress={() => setSelectedDate(day.dateStr)}
                    >
                      <Text style={[s.dayName, isSelected && s.dayNameSelected]}>{day.isToday ? t('staffDashboard.today') : day.dayName}</Text>
                      <Text style={[s.dayNumber, isSelected && s.dayNumberSelected]}>{day.dayNumber}</Text>
                      {isSelected && <View style={s.dateDot} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Agenda List */}
            <View style={s.agendaContainer}>
              <View style={s.agendaHeaderRow}>
                <Text style={s.agendaHeaderTitle}>{t('staffDashboard.yourAgenda')}</Text>
                <View style={s.viewToggle}>
                  <TouchableOpacity 
                    style={[s.viewToggleBtn, (viewMode as any) === "list" && s.viewToggleBtnActive]}
                    onPress={() => setViewMode("list")}
                  >
                    <MaterialCommunityIcons name="format-list-bulleted" size={16} color={(viewMode as any) === "list" ? "#FFF" : T.textMuted} />
                    <Text style={[s.viewToggleText, (viewMode as any) === "list" && s.viewToggleTextActive]}>{t('staffDashboard.list')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[s.viewToggleBtn, (viewMode as any) === "map" && s.viewToggleBtnActive]}
                    onPress={() => setViewMode("map")}
                  >
                    <MaterialCommunityIcons name="map-outline" size={16} color={(viewMode as any) === "map" ? "#FFF" : T.textMuted} />
                    <Text style={[s.viewToggleText, (viewMode as any) === "map" && s.viewToggleTextActive]}>{t('staffDashboard.map')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {isLoading ? (
                <View style={{ gap: 12 }}>
                  {[...Array(3)].map((_, i) => (
                    <View key={i} style={[s.jobCard, { padding: 20, gap: 12 }]}>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <SkeletonBone width={80} height={14} radius={7} />
                        <SkeletonBone width={120} height={14} radius={7} />
                      </View>
                      <SkeletonBone width="100%" height={12} radius={6} />
                      <SkeletonBone width="60%" height={12} radius={6} />
                      <SkeletonBone width="100%" height={44} radius={22} />
                    </View>
                  ))}
                </View>
              ) : dailyJobs.length > 0 ? (
                dailyJobs.map((job, i) => renderJobCard(job, i))
              ) : (
                <View style={s.emptyState}>
                  <IdleStaffCharacter />
                  <Text style={s.emptyTitle}>{t('staffDashboard.noAppointments')}</Text>
                  <Text style={s.emptyDesc}>{t('staffDashboard.clearSchedule')}</Text>
                  <View style={s.emptyBadge}>
                    <MaterialCommunityIcons name="coffee-outline" size={16} color={T.primary} />
                    <Text style={s.emptyBadgeText}>Take a breather ☕</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scrollContent: { paddingBottom: 40 },

  headerRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerInfo: { flex: 1 },
  headerGreeting: { fontSize: 12, fontWeight: "600", color: T.textMuted, marginBottom: 2 },
  headerName: { fontSize: 22, fontWeight: "800", color: T.text, letterSpacing: -0.5 },
  avatarBtn: { padding: 2 },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: T.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.primaryLight,
  },
  avatarInitial: { fontSize: 16, fontWeight: '800', color: '#fff' },
  statusPill: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 24, paddingVertical: 6, paddingHorizontal: 12
  },
  declineLinkBtn: { alignSelf: 'center', marginTop: 8, marginBottom: 16, paddingVertical: 6, paddingHorizontal: 12 },
  declineLinkText: { color: T.error, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, fontWeight: "700", color: T.text, marginRight: 2 },

  metricsContainer: {
    flexDirection: "row", margin: 20, backgroundColor: T.surface,
    borderRadius: 20, padding: 20, borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  metricBox: { flex: 1, alignItems: "center" },
  metricLabel: { fontSize: 12, color: T.textMuted, fontWeight: "600", marginBottom: 4 },
  metricValue: { fontSize: 24, fontWeight: "800", color: T.primary },
  metricDivider: { width: 1, backgroundColor: T.border, marginHorizontal: 16 },

  calendarContainer: { paddingVertical: 4 },
  calendarScroll: { paddingHorizontal: 16, gap: 12 },
  dateBox: { 
    width: 64, height: 80, borderRadius: 16, backgroundColor: T.surface, 
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: T.border 
  },
  dateBoxSelected: { backgroundColor: T.primary, borderColor: T.primary },
  dayName: { fontSize: 12, fontWeight: "700", color: T.textMuted, marginBottom: 4 },
  dayNameSelected: { color: "rgba(255,255,255,0.8)" },
  dayNumber: { fontSize: 20, fontWeight: "800", color: T.text },
  dayNumberSelected: { color: "#FFF" },
  dateDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#FFF", marginTop: 4 },

  agendaContainer: { paddingHorizontal: 20, marginTop: 24 },
  agendaHeaderTitle: { fontSize: 18, fontWeight: "800", color: T.text, marginBottom: 16 },

  // Map & View Toggle
  agendaHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  viewToggle: { flexDirection: "row", backgroundColor: T.border, borderRadius: 8, padding: 2 },
  viewToggleBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  viewToggleBtnActive: { backgroundColor: T.primary },
  viewToggleText: { fontSize: 12, fontWeight: "600", color: T.textMuted },
  viewToggleTextActive: { color: "#FFF" },
  mapContainer: { height: Dimensions.get("window").height * 0.55, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: T.border, ...SHADOW },
  
  fullMapContainer: { flex: 1, position: 'relative' },
  floatingToggle: {
    position: 'absolute', top: 16, alignSelf: 'center',
    flexDirection: "row", backgroundColor: T.surface, borderRadius: 8, padding: 2,
    borderWidth: 1, borderColor: T.border, ...SHADOW
  },
  floatingCardWrapper: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    ...SHADOW
  },

  jobCard: {
    backgroundColor: T.surface, borderRadius: 20, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  jobCardTop: { flexDirection: "row", marginBottom: 16 },
  jobTimeArea: { 
    width: 80, borderRightWidth: 1, borderRightColor: T.border, 
    paddingRight: 12, alignItems: "flex-end" 
  },
  jobTime: { fontSize: 15, fontWeight: "800", color: T.primary, textAlign: "right", marginBottom: 4 },
  jobId: { fontSize: 11, fontWeight: "700", color: T.textMuted, textAlign: "right" },
  
  jobDetailsArea: { flex: 1, paddingLeft: 12 },
  jobTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  jobService: { fontSize: 16, fontWeight: "800", color: T.text, flex: 1, marginRight: 8 },
  badge: { backgroundColor: T.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "800", color: T.success, textTransform: "uppercase" },

  customerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  customerAvatarWrap: { marginRight: 6 },
  customerName: { fontSize: 13, fontWeight: "600", color: T.textMuted },

  locationRow: { flexDirection: "row", alignItems: "center" },
  locationText: { fontSize: 12, color: T.textMuted, marginLeft: 4, flex: 1 },

  jobCardActions: { flexDirection: "row", gap: 8, marginBottom: 16 },
  iconActionBtn: { 
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", 
    backgroundColor: T.primaryLight, paddingVertical: 10, borderRadius: 12, gap: 6 
  },
  iconActionText: { fontSize: 13, fontWeight: "700", color: T.primary },

  fullSwipeWrap: { width: "100%" },
  swipeContainer: {
    height: 56, backgroundColor: T.primaryLight, borderRadius: 28,
    justifyContent: "center", overflow: "hidden",
  },
  swipeFill: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    backgroundColor: T.primary, borderRadius: 28,
  },
  swipeText: {
    position: "absolute", width: "100%", textAlign: "center", 
    color: T.primary, fontWeight: "800", letterSpacing: 1, fontSize: 14,
  },
  swipeHandle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: T.primary,
    justifyContent: "center", alignItems: "center", position: "absolute", left: 0, top: 0, borderWidth: 1, borderColor: T.border,
  },

  emptyState: {
    alignItems: "center", paddingVertical: 48, paddingHorizontal: 24,
    backgroundColor: T.surface, borderRadius: 24, borderWidth: 1, borderColor: T.border,
    ...CARD_SHADOW,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: T.text, marginBottom: 8, marginTop: 24 },
  emptyDesc: { fontSize: 14, color: T.textMuted, textAlign: "center", paddingHorizontal: 32, lineHeight: 22, marginBottom: 16 },
  emptyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.primaryLight, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  emptyBadgeText: { fontSize: 13, fontWeight: '700', color: T.primary },

  // Native Markers
  nativeMarkerBox: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: T.accent,
    borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center'
  },
  nativeMarkerText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
