import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Animated, Platform, Alert, Linking, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MAP_PROVIDER } from '../../../utils/mapHelper';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import SwipeToComplete from '../../../components/SwipeToComplete';
import api from '../../../utils/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { io, Socket } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../../../lib/apiConfig';

const { width } = Dimensions.get('window');

type MachineState = 'LOADING' | 'WAITING' | 'NEW_JOB' | 'TRAVELING' | 'ARRIVED' | 'WORKING' | 'FINISHING' | 'COMPLETED';

export default function TodayScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const insets = useSafeAreaInsets();

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return (d * 0.621371).toFixed(1); // Convert to miles
  };
  const [state, setState] = useState<MachineState>('LOADING');
  const [isOnline, setIsOnline] = useState(true);
  const [checklistStep, setChecklistStep] = useState(0);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ before?: string; during?: string; after?: string }>({});
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // NetInfo Connection Monitor
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState) => {
      const offline = !netState.isConnected || netState.isInternetReachable === false;
      setIsOffline(offline);
    });
    return () => unsubscribe();
  }, []);

  // Sync queue when online
  useEffect(() => {
    if (!isOffline && offlineQueue.length > 0) {
      processOfflineQueue();
    }
  }, [isOffline, offlineQueue]);

  const processOfflineQueue = async () => {
    const queue = [...offlineQueue];
    for (const task of queue) {
      try {
        if (task.type === 'start') {
          await api.patch(`/api/bookings/${task.bookingId}/start`);
        } else if (task.type === 'complete') {
          await api.patch(`/api/bookings/${task.bookingId}/complete`, { proofOfWorkPhoto: task.photo });
        } else if (task.type === 'status') {
          if (task.status === 'pending') {
            await api.patch(`/api/bookings/${task.bookingId}/reject`);
          } else {
            await api.patch(`/api/bookings/${task.bookingId}/status`, { status: task.status });
          }
        } else if (task.type === 'progress') {
          await api.patch(`/api/bookings/${task.bookingId}/progress`, { progressPercent: task.progressPercent, checklist: task.checklist });
        }
        setOfflineQueue(prev => prev.filter(t => t.id !== task.id));
      } catch (err) {
        console.warn("Failed to process queued offline task:", err);
        break; // Retry on next cycle
      }
    }
  };

  // Design system tokens
  const T = { 
    bg: '#F8FAFC', 
    surface: '#FFFFFF', 
    surfaceSubtle: '#F1F5F9',
    text1: '#0F172A', 
    text2: '#475569', 
    text3: '#94A3B8', 
    primary: '#0A192F', 
    primaryLight: '#F1F5F9',
    accent: '#0F172A', 
    success: '#10B981', 
    successDark: '#059669',
    successLight: '#ECFDF5',
    amber: '#F59E0B',
    amberLight: '#FEF3C7',
    border: '#E2E8F0', 
    borderSubtle: '#F8FAFC',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
  };

  // Fluid spring animation for bottom sheet transitions
  const sheetAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    sheetAnim.setValue(0);
    Animated.spring(sheetAnim, {
      toValue: 1,
      friction: 7.5,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [state, selectedJob?.id]);

  useEffect(() => {
    if (state === 'WAITING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state]);

  // Real-time physical device GPS watcher & live WebSocket broadcast
  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let socket: any = null;

    (async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
        if (!servicesEnabled) return;

        const { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
        if (status !== 'granted') return;

        socket = io(SOCKET_URL || API_URL, { transports: ['websocket'] });
        if (activeBooking?.id) {
          socket.emit('join_booking', String(activeBooking.id));
        }

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 5,
          },
          (newLoc) => {
            let coords = newLoc.coords;
            const isAndroidEmu = Math.abs(coords.latitude - 37.422) < 0.2 && Math.abs(coords.longitude - (-122.084)) < 0.2;
            const isIosEmu = (Math.abs(coords.latitude - 37.785) < 0.3 && Math.abs(coords.longitude - (-122.406)) < 0.3);
            if (isAndroidEmu || isIosEmu) {
              coords = { ...coords, latitude: 11.5564, longitude: 104.9282 };
            }

            const resolvedLoc = { ...newLoc, coords };
            setLocation(resolvedLoc);

            // Stream real device GPS when traveling
            if (state === 'TRAVELING' && activeBooking?.id && socket) {
              socket.emit('staff_location_update', {
                bookingId: String(activeBooking.id),
                latitude: coords.latitude,
                longitude: coords.longitude,
              });
            }
          }
        ).catch(() => null);
      } catch {
        // Location watch unavailable — graceful fallback
      }
    })();

    return () => {
      sub?.remove();
      if (socket) {
        if (activeBooking?.id) socket.emit('leave_booking', String(activeBooking.id));
        socket.disconnect();
      }
    };
  }, [state, activeBooking?.id]);

  // Auto zoom map to show route when traveling
  useEffect(() => {
    if (state === 'TRAVELING' && location && activeBooking) {
      (async () => {
        try {
          const startLng = location.coords.longitude;
          const startLat = location.coords.latitude;
          const endLng = Number(activeBooking.longitude);
          const endLat = Number(activeBooking.latitude);

          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`);
          const data = await res.json();
          
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => ({
              latitude: c[1],
              longitude: c[0]
            }));
            setRouteCoords(coords);
            
            setTimeout(() => {
              mapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: 120, right: 60, bottom: Dimensions.get('window').height / 2, left: 60 },
                animated: true,
              });
            }, 300);
          } else {
             // Fallback
             mapRef.current?.fitToCoordinates([
                { latitude: startLat, longitude: startLng },
                { latitude: endLat, longitude: endLng }
             ], { edgePadding: { top: 120, right: 60, bottom: Dimensions.get('window').height / 2, left: 60 }, animated: true });
          }
        } catch (e) {
          console.warn("OSRM Routing failed:", e);
        }
      })();
    } else {
       setRouteCoords([]);
    }
  }, [state, location?.coords.latitude, location?.coords.longitude, activeBooking?.id]);

  const loadJobs = async () => {
    try {
      // Fetch assignments to see if currently working
      const res = await api.get('/api/bookings/my-assignments'); 
      let bookings = [];
      if (Array.isArray(res.data)) {
        bookings = res.data;
      } else if (res.data?.bookings) {
        bookings = res.data.bookings;
      } else if (res.data?.data?.bookings) {
        bookings = res.data.data.bookings;
      } else if (Array.isArray(res.data?.data)) {
        bookings = res.data.data;
      }
      
      const active = bookings.find((b: any) => ['pending', 'confirmed', 'in_progress'].includes(b.status));

      if (active) {
        setActiveBooking(active);
        
        // Restore progress step index from database checklist status on load
        if (active.checklist && Array.isArray(active.checklist)) {
          const firstUncompleted = active.checklist.findIndex((item: any) => !item.completed);
          if (firstUncompleted !== -1) {
            setChecklistStep(firstUncompleted);
          } else {
            setChecklistStep(active.checklist.length - 1);
          }
        } else {
          setChecklistStep(0);
        }

        if (active.status === 'pending' || active.status === 'confirmed') setState('NEW_JOB');
        else if (active.status === 'in_progress') setState('WORKING');
        else setState('WAITING');
      } else {
        // Fetch open job board
        const boardRes = await api.get('/api/bookings');
        let allCompanyBookings = [];
        if (Array.isArray(boardRes.data)) {
          allCompanyBookings = boardRes.data;
        } else if (boardRes.data?.bookings) {
          allCompanyBookings = boardRes.data.bookings;
        } else if (boardRes.data?.data?.bookings) {
          allCompanyBookings = boardRes.data.data.bookings;
        } else if (Array.isArray(boardRes.data?.data)) {
          allCompanyBookings = boardRes.data.data;
        }
        
        // Filter to only bookings that do NOT have an assigned staff member
        const unassigned = allCompanyBookings.filter((b: any) => !b.assignedStaffId && ['pending', 'confirmed'].includes(b.status));
        setAvailableJobs(unassigned);
        setState('WAITING');
      }
    } catch (error) {
      setState('WAITING');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const servicesEnabled = await Location.hasServicesEnabledAsync().catch(() => false);
          if (servicesEnabled) {
            let { status } = await Location.requestForegroundPermissionsAsync().catch(() => ({ status: 'denied' }));
            if (status === 'granted') {
              let loc = await Location.getLastKnownPositionAsync().catch(() => null);
              if (!loc) {
                loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
              }
              
              // Normalize simulator coordinates to Phnom Penh BKK1
              if (loc) {
                const lat = loc.coords.latitude;
                const lng = loc.coords.longitude;
                const isAndroidEmu = Math.abs(lat - 37.422) < 0.2 && Math.abs(lng - (-122.084)) < 0.2;
                const isIosEmu = (Math.abs(lat - 37.785) < 0.3 && Math.abs(lng - (-122.406)) < 0.3) || 
                                 (Math.abs(lat - 37.332) < 0.3 && Math.abs(lng - (-122.030)) < 0.3);
                
                if (isAndroidEmu || isIosEmu) {
                  loc = {
                    ...loc,
                    coords: { ...loc.coords, latitude: 11.5564, longitude: 104.9282 }
                  };
                }
              }
              
              if (loc) {
                setLocation(loc);

                try {
                  if (loc?.coords) {
                    await api.patch('/api/users/me/location', {
                      latitude: loc.coords.latitude,
                      longitude: loc.coords.longitude
                    });
                  }
                  await api.patch('/api/users/me/staff-status', { status: 'active' });
                } catch {
                  // Non-critical background sync
                }
              }
            }
          }
        } catch {
          // Location unavailable — silent fallback
        }

        loadJobs();
      })();
    }, [])
  );

  const updateBackendStatus = async (newStatus: string) => {
    if (!activeBooking?.id) return;

    const taskId = Math.random().toString(36).substring(7);
    const taskType = newStatus === 'in_progress' ? 'start' : newStatus === 'completed' ? 'complete' : 'status';
    const taskPayload = {
      id: taskId,
      bookingId: activeBooking.id,
      type: taskType,
      status: newStatus,
      photo: JSON.stringify(uploadedPhotos),
      timestamp: Date.now()
    };

    if (isOffline) {
      setOfflineQueue(prev => [...prev, taskPayload]);
      Alert.alert(
        "Working Offline",
        "Your offline updates have been saved and will sync automatically when your internet connection is restored."
      );
      return;
    }

    try {
      if (newStatus === 'in_progress') {
        await api.patch(`/api/bookings/${activeBooking.id}/start`);
      } else if (newStatus === 'completed') {
        const payload: any = {};
        if (Object.keys(uploadedPhotos).length > 0) payload.proofOfWorkPhoto = JSON.stringify(uploadedPhotos);
        await api.patch(`/api/bookings/${activeBooking.id}/complete`, payload);
      } else {
        await api.patch(`/api/bookings/${activeBooking.id}/status`, { status: newStatus });
      }
    } catch (e) {
      console.warn("Online update failed, saving offline:", e);
      setOfflineQueue(prev => [...prev, taskPayload]);
      Alert.alert(
        "Queued Offline",
        "Network connection lost. The update has been saved locally and will sync once online."
      );
    }
  };

  const handlePickJob = async (job: any) => {
    try {
      try {
        await api.patch(`/api/bookings/${job.id}/claim`);
      } catch (err: any) {
        const userRes = await api.get('/api/auth/me');
        let me = userRes.data?.data?.user || userRes.data?.user || userRes.data?.data || userRes.data;
        if (me?.staffProfile?.id) {
          await api.patch(`/api/bookings/${job.id}/assign-staff`, { staffId: me.staffProfile.id });
        } else {
          throw err;
        }
      }
      setActiveBooking(job);
      setChecklistStep(0);
      setSelectedJob(null);
      setState('TRAVELING');
    } catch (e: any) {
      console.error("Failed to pick job", e);
      if (e.response && e.response.status === 409) {
         Alert.alert("Job Taken", "Another staff member already claimed this job.");
         setSelectedJob(null);
         loadJobs(); // Refresh the board
      } else {
         Alert.alert("Error", e?.response?.data?.message || "Could not claim job.");
      }
    }
  };

  const handleAccept = async () => {
    try {
      await api.patch(`/api/bookings/${activeBooking.id}/start`);
    } catch (e) {}
    setState('TRAVELING');
  };

  // Live GPS broadcast when in TRAVELING mode
  useEffect(() => {
    if (state !== 'TRAVELING' || !activeBooking?.id || routeCoords.length === 0) return;

    let socket: any = null;
    let idx = 0;
    const total = routeCoords.length;

    try {
      socket = io(SOCKET_URL || API_URL, { transports: ['websocket'] });
      socket.on('connect', () => {
        socket.emit('join_booking', String(activeBooking.id));
      });
    } catch (e) {}

    const interval = setInterval(() => {
      idx++;
      if (idx < total) {
        const currentCoord = routeCoords[idx];
        setLocation({ coords: currentCoord } as any);

        // Broadcast to WebSocket room for customer live map
        if (socket) {
          socket.emit('staff_location_update', {
            bookingId: String(activeBooking.id),
            latitude: currentCoord.latitude,
            longitude: currentCoord.longitude,
          });
        }
      } else {
        // Reached destination
        (async () => {
          try {
            await api.patch(`/api/bookings/${activeBooking.id}/status`, { status: 'arrived' });
          } catch (e) {}
          setState('ARRIVED');
        })();
        clearInterval(interval);
      }
    }, 1200);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.emit('leave_booking', String(activeBooking.id));
        socket.disconnect();
      }
    };
  }, [state, activeBooking?.id, routeCoords]);

  const handleDecline = async () => {
    if (!activeBooking?.id) return;
    
    try {
      if (isOffline) {
        const taskId = Math.random().toString(36).substring(7);
        setOfflineQueue(prev => [...prev, {
          id: taskId,
          bookingId: activeBooking.id,
          type: 'status',
          status: 'pending',
          timestamp: Date.now()
        }]);
        setActiveBooking(null);
        setState('WAITING');
        loadJobs();
        return;
      }

      await api.patch(`/api/bookings/${activeBooking.id}/reject`);
      setActiveBooking(null);
      setState('WAITING');
      loadJobs();
    } catch (e: any) {
      console.error("Failed to decline booking:", e);
      Alert.alert("Error", e?.response?.data?.message || "Could not decline booking.");
    }
  };

  const handlePhoneCall = () => {
    const phone = activeBooking?.customer?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('No phone number', 'The customer did not provide a phone number.');
    }
  };

  const handleNavigate = () => {
    const lat = activeBooking?.latitude;
    const lng = activeBooking?.longitude;
    const label = activeBooking?.serviceAddress || 'Destination';
    if (!lat || !lng) return;
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`
    });
    
    if (url) {
      Linking.openURL(url).catch(() => {
         Alert.alert('Error', 'Could not open maps application.');
      });
    }
  };

  const handleChat = () => {
    if (!activeBooking?.customerId) {
       Alert.alert('Error', 'No customer assigned to this booking.');
       return;
    }
    const name = activeBooking?.customer?.fullName || 'Customer';
    // Navigate to the real staff messages screen (/(staff)/messages/[userId])
    router.push(`/(staff)/messages/${activeBooking.customerId}?otherName=${encodeURIComponent(name)}` as any);
  };

  const handleMarkStepComplete = async () => {
    if (!activeBooking) return;
    
    const rawChecklist = activeBooking.checklist;
    const hasDbChecklist = Array.isArray(rawChecklist) && rawChecklist.length > 0;
    
    let currentChecklist = hasDbChecklist 
      ? rawChecklist 
      : [
          { id: 1, title: "Arrive & Inspect Site", completed: false },
          { id: 2, title: `Perform: ${activeBooking?.service?.name || "Service"}`, completed: false },
          { id: 3, title: "Clean up & Verify", completed: false },
          { id: 4, title: "Upload Photos", completed: false }
        ];

    const updatedChecklist = currentChecklist.map((item: any, idx: number) => {
      if (idx === checklistStep) return { ...item, completed: true };
      return item;
    });

    const nextStep = checklistStep + 1;
    setChecklistStep(nextStep);
    
    setActiveBooking((prev: any) => ({
      ...prev,
      checklist: updatedChecklist
    }));

    try {
      const pct = Math.round((nextStep / currentChecklist.length) * 100);
      
      if (isOffline) {
        const taskId = Math.random().toString(36).substring(7);
        setOfflineQueue(prev => [...prev, {
          id: taskId,
          bookingId: activeBooking.id,
          type: 'progress',
          progressPercent: pct,
          checklist: updatedChecklist,
          timestamp: Date.now()
        }]);
        return;
      }

      await api.patch(`/api/bookings/${activeBooking.id}/progress`, {
        progressPercent: pct,
        checklist: updatedChecklist
      });
    } catch (err) {
      console.warn("Failed to sync step progress:", err);
    }
  };

  const handleUploadPhotoForType = async (type: 'before' | 'during' | 'after') => {
    Alert.alert(
      `${type.toUpperCase()} Photo`,
      `Capture or select a ${type} service photo.`,
      [
        {
          text: "Take Photo (Camera)",
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) {
                Alert.alert("Permission Required", "Camera permission is required.");
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]) {
                const uri = result.assets[0].uri;
                setUploadedPhotos(prev => ({ ...prev, [type]: uri }));
                const formData = new FormData();
                formData.append("file", { uri, type: "image/jpeg", name: `job_${type}_${Date.now()}.jpg` } as any);
                formData.append("bookingId", String(activeBooking.id));
                formData.append("photoType", type);
                await api.post("/api/bookings/photos", formData, { headers: { "Content-Type": "multipart/form-data" } });
              }
            } catch (e) {
              console.warn("Camera error:", e);
            }
          }
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            try {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!perm.granted) {
                Alert.alert("Permission Required", "Library permission is required.");
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]) {
                const uri = result.assets[0].uri;
                setUploadedPhotos(prev => ({ ...prev, [type]: uri }));
                const formData = new FormData();
                formData.append("file", { uri, type: "image/jpeg", name: `job_${type}_${Date.now()}.jpg` } as any);
                formData.append("bookingId", String(activeBooking.id));
                formData.append("photoType", type);
                await api.post("/api/bookings/photos", formData, { headers: { "Content-Type": "multipart/form-data" } });
              }
            } catch (e) {
              console.warn("Library error:", e);
            }
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const BigButton = ({ 
    label, 
    onPress, 
    variant = 'primary', 
    icon, 
    color,
    textColor,
    outline = false,
    disabled = false,
    loading = false,
  }: any) => {
    let resolvedBg = color || T.primary;
    let resolvedText = textColor || '#FFFFFF';
    let resolvedBorder = 'transparent';
    let borderWidth = 0;

    if (outline) {
      resolvedBg = '#FFFFFF';
      resolvedText = color || T.text1;
      resolvedBorder = color || T.border;
      borderWidth = 1.5;
    } else if (variant === 'success') {
      resolvedBg = T.success;
      resolvedText = '#FFFFFF';
    } else if (variant === 'danger') {
      resolvedBg = T.danger;
      resolvedText = '#FFFFFF';
    } else if (variant === 'secondary') {
      resolvedBg = T.surfaceSubtle;
      resolvedText = T.text2;
      resolvedBorder = T.border;
      borderWidth = 1;
    }

    return (
      <TouchableOpacity 
        style={[
          s.bigBtn, 
          { backgroundColor: resolvedBg, borderColor: resolvedBorder, borderWidth },
          disabled && { opacity: 0.5 }
        ]} 
        onPress={onPress} 
        activeOpacity={0.85}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={resolvedText} />
        ) : (
          <>
            {icon && (
              <MaterialCommunityIcons 
                name={icon} 
                size={20} 
                color={resolvedText} 
                style={{ marginRight: 8 }} 
              />
            )}
            <Text style={[s.bigBtnText, { color: resolvedText }]}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      {/* Background Map or List View depending on Mode */}
      {state === 'WAITING' && viewMode === 'list' ? (
        <ScrollView style={[s.listContainer, { marginTop: insets.top + 80, marginBottom: insets.bottom + 120 }]} contentContainerStyle={{ padding: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
          <View style={s.listHeaderRow}>
            <Text style={s.listTitle}>Available Jobs</Text>
            <View style={s.countBadge}>
              <Text style={s.countBadgeText}>{availableJobs.length} open</Text>
            </View>
          </View>
          {availableJobs.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <MaterialCommunityIcons name="clipboard-text-search-outline" size={40} color={T.text3} />
              </View>
              <Text style={s.emptyTitle}>No Jobs in Your Area</Text>
              <Text style={s.emptyText}>New requests from your company will appear here automatically.</Text>
            </View>
          ) : (
            availableJobs.map((job) => (
              <TouchableOpacity 
                key={job.id} 
                style={s.jobCard} 
                onPress={() => setSelectedJob(job)}
                activeOpacity={0.85}
              >
                <View style={s.jobCardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={s.jobCardService}>{job.service?.name || "Service"}</Text>
                    <View style={s.metaChipsRow}>
                      <View style={s.miniChip}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color={T.text3} />
                        <Text style={s.miniChipText}>{job.service?.durationMin || 60}m</Text>
                      </View>
                      <View style={s.miniChip}>
                        <MaterialCommunityIcons name="calendar-blank-outline" size={12} color={T.text3} />
                        <Text style={s.miniChipText}>{new Date(job.bookingDate).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={s.jobCardPriceContainer}>
                    <Text style={s.jobCardPrice}>${job.totalPrice || "35.00"}</Text>
                    <Text style={s.jobCardPriceLabel}>payout</Text>
                  </View>
                </View>
                
                <View style={s.jobCardAddressRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={15} color={T.primary} style={{ marginRight: 6 }} />
                  <Text style={s.jobCardAddress} numberOfLines={1}>{job.serviceAddress || "Address hidden"}</Text>
                </View>
                
                <View style={s.jobCardFooter}>
                  <Text style={s.claimLink}>Tap to review & claim</Text>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={T.primary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <MapView
          provider={MAP_PROVIDER}
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation={true}
          showsMyLocationButton={false}
          customMapStyle={mapStyle}
          initialRegion={{
            latitude: location?.coords.latitude || 11.5564,
            longitude: location?.coords.longitude || 104.9282,
            latitudeDelta: 0.0522,
            longitudeDelta: 0.0221,
          }}
        >
          {/* Active Booking Marker */}
          {activeBooking && activeBooking.serviceAddress && (
             <Marker 
               coordinate={{
                 latitude: Number(activeBooking.latitude) || (location?.coords.latitude || 0) + 0.01,
                 longitude: Number(activeBooking.longitude) || (location?.coords.longitude || 0) + 0.01
               }}
             >
               <View style={s.markerContainerActive}>
                  <MaterialCommunityIcons name="map-marker" size={24} color="#FFF" />
               </View>
             </Marker>
          )}

          {/* Job Board Markers */}
          {state === 'WAITING' && availableJobs.map((job) => (
             <Marker 
               key={`marker-${job.id}`}
               coordinate={{
                 latitude: Number(job.latitude) || (location?.coords.latitude || 0) + (Math.random() * 0.02 - 0.01),
                 longitude: Number(job.longitude) || (location?.coords.longitude || 0) + (Math.random() * 0.02 - 0.01)
               }}
               onPress={() => setSelectedJob(job)}
             >
               <View style={[
                 s.markerContainer, 
                 selectedJob?.id === job.id && s.markerContainerSelected
               ]}>
                  <MaterialCommunityIcons 
                    name="briefcase" 
                    size={16} 
                    color={selectedJob?.id === job.id ? "#FFF" : T.primary} 
                  />
               </View>
             </Marker>
          ))}

          {/* Driving Route Polyline */}
          {state === 'TRAVELING' && activeBooking && location && (
             <Polyline 
               coordinates={
                 routeCoords.length > 0 
                   ? routeCoords 
                   : [
                       { latitude: location.coords.latitude, longitude: location.coords.longitude },
                       { latitude: Number(activeBooking.latitude), longitude: Number(activeBooking.longitude) }
                     ]
               }
               strokeColor={T.primary}
               strokeWidth={5}
             />
          )}
        </MapView>
      )}

      {/* Floating Header */}
      <View style={[s.floatingHeader, { top: insets.top + 10 }]}>
        <View style={s.floatingHeaderCard}>
          <View style={s.statusPillGroup}>
            <View style={[s.statusCapsule, isOnline ? s.statusCapsuleOnline : s.statusCapsuleOffline]}>
              <View style={[s.statusDot, { backgroundColor: isOnline ? T.success : T.text3 }]} />
              <Text style={[s.statusCapsuleText, { color: isOnline ? T.successDark : T.text3 }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>

            {isOffline && (
              <View style={[s.statusCapsule, { backgroundColor: T.dangerLight }]}>
                <MaterialCommunityIcons name="cloud-off-outline" size={14} color={T.danger} />
                <Text style={[s.statusCapsuleText, { color: T.danger }]}>Offline Sync</Text>
              </View>
            )}
          </View>
          
          {isOnline && state === 'WAITING' && (
            <View style={s.toggleSegment}>
              <TouchableOpacity 
                style={[s.toggleSegmentBtn, viewMode === 'map' && s.toggleSegmentBtnActive]} 
                onPress={() => setViewMode('map')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons 
                  name="map-outline" 
                  size={16} 
                  color={viewMode === 'map' ? '#FFFFFF' : T.text2} 
                />
                <Text style={[s.toggleSegmentText, viewMode === 'map' && s.toggleSegmentTextActive]}>Map</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.toggleSegmentBtn, viewMode === 'list' && s.toggleSegmentBtnActive]} 
                onPress={() => setViewMode('list')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons 
                  name="format-list-bulleted" 
                  size={16} 
                  color={viewMode === 'list' ? '#FFFFFF' : T.text2} 
                />
                <Text style={[s.toggleSegmentText, viewMode === 'list' && s.toggleSegmentTextActive]}>List</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Offline Alert Banner */}
      {isOffline && (
        <View style={[s.offlineBanner, { top: insets.top + 72 }]}>
          <MaterialCommunityIcons name="wifi-off" size={14} color="#FFF" />
          <Text style={s.offlineBannerText}>Working offline. Actions will queue and sync automatically.</Text>
        </View>
      )}

      {/* The Bottom Sheet - Elevated Floating Modal */}
      <Animated.View style={[
        s.bottomSheet, 
        isCollapsed ? s.bottomSheetCollapsed : null,
        {
          opacity: sheetAnim,
          transform: [{
            translateY: sheetAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            })
          }]
        }
      ]}>
        {/* Drag Handle & Collapse Bar */}
        <TouchableOpacity 
          style={s.sheetHandleContainer} 
          onPress={() => setIsCollapsed(!isCollapsed)}
          activeOpacity={0.8}
        >
          <View style={s.sheetHandle} />
          {isCollapsed && (
            <View style={s.collapsedSummaryRow}>
              <View style={s.collapsedStatusDot} />
              <Text style={s.collapsedSummaryText}>
                {state === 'WAITING' ? `Finding Jobs (${availableJobs.length} nearby)` : 
                 state === 'NEW_JOB' ? `⚡ New Assignment · $${activeBooking?.totalPrice || '35.00'}` :
                 state === 'TRAVELING' ? `🚗 En Route to ${activeBooking?.customer?.fullName || 'Client'}` :
                 state === 'WORKING' ? `🔧 In Progress · ${activeBooking?.service?.name || 'Task'}` : 'View Details'}
              </Text>
              <MaterialCommunityIcons name="chevron-up" size={18} color={T.primary} />
            </View>
          )}
        </TouchableOpacity>

        {!isCollapsed && (
          <ScrollView 
            style={{ maxHeight: Dimensions.get('window').height * 0.65 }}
            contentContainerStyle={s.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >

            {/* 1. LOADING STATE */}
            {isOnline && state === 'LOADING' && (
              <View style={s.centerStateContainer}>
                <View style={s.loadingRing}>
                  <ActivityIndicator size="large" color={T.primary} />
                </View>
                <Text style={s.stateTitle}>Syncing Schedule...</Text>
                <Text style={s.stateSubtitle}>Fetching your assigned dispatches and live orders.</Text>
              </View>
            )}

            {/* 2. OFFLINE STATE */}
            {!isOnline && (
              <View style={s.centerStateContainer}>
                <View style={[s.iconHalo, { backgroundColor: T.surfaceSubtle }]}>
                  <MaterialCommunityIcons name="power" size={32} color={T.text3} />
                </View>
                <Text style={s.stateTitle}>You Are Offline</Text>
                <Text style={s.stateSubtitle}>Go online to start receiving customer job assignments in real-time.</Text>
                <View style={s.btnWrapper}>
                  <BigButton 
                    label="GO ONLINE NOW" 
                    onPress={() => setIsOnline(true)} 
                    variant="success" 
                    icon="lightning-bolt" 
                  />
                </View>
              </View>
            )}

            {/* 3. WAITING STATE (Searching Radar / Selected Job) */}
            {isOnline && state === 'WAITING' && (
              !selectedJob ? (
                <View style={s.centerStateContainer}>
                  <Animated.View style={[s.radarOuterCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <View style={s.radarMiddleCircle}>
                      <View style={s.radarCenterDot}>
                        <MaterialCommunityIcons name="radar" size={28} color="#FFF" />
                      </View>
                    </View>
                  </Animated.View>
                  
                  <View style={s.searchingBadge}>
                    <View style={s.pulsingGreenDot} />
                    <Text style={s.searchingBadgeText}>LIVE DISPATCH POOL</Text>
                  </View>

                  <Text style={s.stateTitle}>Looking for Nearby Jobs</Text>
                  <Text style={s.stateSubtitle}>
                    {availableJobs.length > 0 
                      ? `${availableJobs.length} jobs available in your company network. Tap a marker to claim.` 
                      : 'Standing by for incoming dispatch requests in Phnom Penh.'}
                  </Text>
                  
                  <View style={[s.btnWrapper, { marginTop: 20 }]}>
                    <BigButton 
                      label="GO OFFLINE" 
                      onPress={() => setIsOnline(false)} 
                      outline 
                      color={T.text3} 
                      icon="power" 
                    />
                  </View>
                </View>
              ) : (
                /* Selected Job Quick Preview */
                <View style={s.jobOfferContainer}>
                  <View style={s.offerHeaderRow}>
                    <View style={s.offerCategoryBadge}>
                      <MaterialCommunityIcons name="briefcase-outline" size={13} color={T.primary} />
                      <Text style={s.offerCategoryText}>COMPANY DISPATCH POOL</Text>
                    </View>
                    <View style={s.offerPricePill}>
                      <Text style={s.offerPriceText}>${selectedJob.totalPrice || "35.00"}</Text>
                    </View>
                  </View>

                  <Text style={s.offerServiceTitle}>{selectedJob.service?.name || "Service"}</Text>

                  <View style={s.chipsRow}>
                    <View style={s.chip}>
                      <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={T.text2} />
                      <Text style={s.chipText}>{selectedJob.service?.durationMin || 60} mins</Text>
                    </View>
                    <View style={s.chip}>
                      <MaterialCommunityIcons name="map-marker-distance" size={14} color={T.text2} />
                      <Text style={s.chipText}>Nearby</Text>
                    </View>
                  </View>

                  <View style={s.locationCard}>
                    <View style={s.locationIconCircle}>
                      <MaterialCommunityIcons name="map-marker" size={18} color={T.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.locationLabel}>Service Address</Text>
                      <Text style={s.locationAddress} numberOfLines={2}>
                        {selectedJob.serviceAddress || "Address hidden until claimed"}
                      </Text>
                    </View>
                  </View>

                  <View style={s.actionButtonsRow}>
                    <View style={{ flex: 1 }}>
                      <BigButton 
                        label="Close" 
                        onPress={() => setSelectedJob(null)} 
                        outline 
                        color={T.text3} 
                      />
                    </View>
                    <View style={{ flex: 2 }}>
                      <BigButton 
                        label="Claim & Start" 
                        onPress={() => handlePickJob(selectedJob)} 
                        variant="success" 
                        icon="lightning-bolt" 
                      />
                    </View>
                  </View>
                </View>
              )
            )}

            {/* 4. NEW_JOB (Direct Assigned Offer Modal) */}
            {isOnline && state === 'NEW_JOB' && (
              (() => {
                const distance = location && activeBooking?.latitude && activeBooking?.longitude
                  ? `${getDistance(location.coords.latitude, location.coords.longitude, Number(activeBooking.latitude), Number(activeBooking.longitude))} mi away`
                  : "Nearby BKK1";
                
                const durationMin = activeBooking?.service?.durationMin || 120;
                const durationText = durationMin >= 60 
                  ? `${(durationMin / 60).toFixed(1)} Hours` 
                  : `${durationMin} Mins`;

                const customerName = activeBooking?.customer?.fullName || "Customer";
                const initials = customerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <View style={s.jobOfferContainer}>
                    {/* Header Banner */}
                    <View style={s.dispatchAlertHeader}>
                      <View style={s.dispatchAlertBadge}>
                        <MaterialCommunityIcons name="flash" size={14} color="#D97706" />
                        <Text style={s.dispatchAlertText}>NEW DISPATCH ASSIGNMENT</Text>
                      </View>
                      <View style={s.payoutBlock}>
                        <Text style={s.payoutAmount}>${activeBooking?.totalPrice || "35.00"}</Text>
                        <Text style={s.payoutSub}>est. payout</Text>
                      </View>
                    </View>

                    {/* Service Name */}
                    <Text style={s.offerServiceTitle}>{activeBooking?.service?.name || "Professional Cleaning"}</Text>

                    {/* Meta Chips */}
                    <View style={s.chipsRow}>
                      <View style={s.chip}>
                        <MaterialCommunityIcons name="map-marker-radius" size={14} color={T.primary} />
                        <Text style={s.chipText}>{distance}</Text>
                      </View>
                      <View style={s.chip}>
                        <MaterialCommunityIcons name="timer-outline" size={14} color={T.text2} />
                        <Text style={s.chipText}>{durationText}</Text>
                      </View>
                      <View style={s.chip}>
                        <MaterialCommunityIcons name="calendar-check" size={14} color={T.text2} />
                        <Text style={s.chipText}>Today</Text>
                      </View>
                    </View>

                    {/* Customer Profile Card */}
                    <View style={s.customerProfileCard}>
                      <View style={s.customerAvatar}>
                        <Text style={s.customerAvatarText}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={s.customerName}>{customerName}</Text>
                          <MaterialCommunityIcons name="check-decagram" size={14} color={T.primary} />
                        </View>
                        <Text style={s.customerRole}>Assigned Customer · Booking #{activeBooking?.id}</Text>
                      </View>
                    </View>

                    {/* Destination Address Box */}
                    <View style={s.locationCard}>
                      <View style={s.locationIconCircle}>
                        <MaterialCommunityIcons name="navigation-variant" size={18} color={T.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.locationLabel}>Service Destination</Text>
                        <Text style={s.locationAddress} numberOfLines={2}>
                          {activeBooking?.serviceAddress || "Address loading..."}
                        </Text>
                      </View>
                    </View>

                    {/* Slide to Accept Slider + Decline Option */}
                    <View style={s.sliderActionBlock}>
                      <SwipeToComplete 
                        text="Slide to Accept & Start 🚀" 
                        onComplete={handleAccept} 
                        activeTrackColor="#10B981"
                        icon="navigation-variant"
                      />
                      <TouchableOpacity style={s.declineButton} onPress={handleDecline} activeOpacity={0.8}>
                        <MaterialCommunityIcons name="close-circle-outline" size={16} color={T.danger} style={{ marginRight: 4 }} />
                        <Text style={s.declineButtonText}>Decline Dispatch Offer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()
            )}

            {/* 5. TRAVELING (En Route Navigation Mode) */}
            {isOnline && state === 'TRAVELING' && (
              (() => {
                const customerName = activeBooking?.customer?.fullName || "Customer";
                const initials = customerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                return (
                  <View style={s.jobOfferContainer}>
                    {/* Status Pill */}
                    <View style={s.enRouteHeader}>
                      <View style={s.enRoutePulseBadge}>
                        <View style={s.pulsingGreenDot} />
                        <Text style={s.enRouteBadgeText}>EN ROUTE TO CUSTOMER</Text>
                      </View>
                      <Text style={s.enRouteEta}>Live GPS Broadcasting</Text>
                    </View>

                    {/* Client Card with Quick Actions */}
                    <View style={s.customerProfileCard}>
                      <View style={s.customerAvatar}>
                        <Text style={s.customerAvatarText}>{initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.customerName}>{customerName}</Text>
                        <Text style={s.customerRole}>Waiting for your arrival</Text>
                      </View>
                      <View style={s.quickContactRow}>
                        <TouchableOpacity style={s.quickActionBtn} onPress={handlePhoneCall} activeOpacity={0.8}>
                          <MaterialCommunityIcons name="phone" size={18} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.quickActionBtn, { backgroundColor: T.primary }]} onPress={handleChat} activeOpacity={0.8}>
                          <MaterialCommunityIcons name="message-text" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Address Box */}
                    <View style={s.locationCard}>
                      <View style={s.locationIconCircle}>
                        <MaterialCommunityIcons name="map-marker-radius" size={18} color={T.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.locationLabel}>Destination Address</Text>
                        <Text style={s.locationAddress} numberOfLines={2}>
                          {activeBooking?.serviceAddress || "Address Loading..."}
                        </Text>
                      </View>
                    </View>

                    {/* Slide to Confirm Arrival + Maps Action */}
                    <View style={s.sliderActionBlock}>
                      <SwipeToComplete 
                        text="Slide to Confirm Arrival 📍" 
                        onComplete={() => {
                          updateBackendStatus('arrived');
                          setState('ARRIVED');
                        }} 
                        activeTrackColor="#10B981"
                        icon="map-marker-check"
                      />
                      <TouchableOpacity style={s.mapsOutlineBtn} onPress={handleNavigate} activeOpacity={0.8}>
                        <MaterialCommunityIcons name="map-search-outline" size={16} color={T.primary} style={{ marginRight: 6 }} />
                        <Text style={s.mapsOutlineBtnText}>Open External GPS (Google / Apple Maps)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()
            )}

            {/* 6. ARRIVED STATE */}
            {isOnline && state === 'ARRIVED' && (
              <View style={s.centerStateContainer}>
                <View style={[s.iconHalo, { backgroundColor: T.successLight }]}>
                  <MaterialCommunityIcons name="map-marker-check" size={44} color={T.success} />
                </View>
                <Text style={s.stateTitle}>You've Arrived!</Text>
                <Text style={s.stateSubtitle}>
                  Meet with {activeBooking?.customer?.fullName || 'the client'} and begin the service workflow.
                </Text>
                <View style={s.btnWrapper}>
                  <BigButton 
                    label="START SERVICE CHECKLIST ▶" 
                    onPress={() => {
                      updateBackendStatus('in_progress');
                      setState('WORKING');
                    }} 
                    variant="primary" 
                    icon="play" 
                  />
                </View>
              </View>
            )}

            {/* 7. WORKING STATE (Checklist) */}
            {isOnline && state === 'WORKING' && (
              (() => {
                const dbChecklist = activeBooking?.checklist;
                const hasDbChecklist = Array.isArray(dbChecklist) && dbChecklist.length > 0;

                const checklistItems = hasDbChecklist
                  ? dbChecklist.map((item: any) => item.title)
                  : [
                      "Arrive & Inspect Site", 
                      `Perform: ${activeBooking?.service?.name || "Service"}`, 
                      "Clean up & Verify", 
                      "Upload Photo Proof"
                    ];

                const pct = Math.round((checklistStep / checklistItems.length) * 100);
                
                return (
                  <View style={s.jobOfferContainer}>
                    <View style={s.progressHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.progressTaskTitle}>{activeBooking?.service?.name || "Service in Progress"}</Text>
                        <Text style={s.progressStepCounter}>Step {Math.min(checklistStep + 1, checklistItems.length)} of {checklistItems.length}</Text>
                      </View>
                      <View style={s.progressPercentBadge}>
                        <Text style={s.progressPercentText}>{pct}% Complete</Text>
                      </View>
                    </View>

                    {/* Progress Bar Track */}
                    <View style={s.progressBarTrack}>
                      <View style={[s.progressBarFill, { width: `${pct}%` }]} />
                    </View>
                    
                    {/* Step Cards */}
                    <View style={s.stepsContainer}>
                      {checklistItems.map((item: string, idx: number) => {
                        const isDone = checklistStep > idx;
                        const isActive = checklistStep === idx;
                        return (
                          <View 
                            key={idx} 
                            style={[
                              s.stepCard, 
                              isDone && s.stepCardDone,
                              isActive && s.stepCardActive
                            ]}
                          >
                            <View style={[
                              s.stepCheckbox, 
                              isDone && s.stepCheckboxDone,
                              isActive && s.stepCheckboxActive
                            ]}>
                              {isDone ? (
                                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                              ) : (
                                <Text style={[s.stepNumberText, isActive && { color: T.primary }]}>{idx + 1}</Text>
                              )}
                            </View>
                            <Text style={[
                              s.stepTitle, 
                              isDone && s.stepTitleDone,
                              isActive && s.stepTitleActive
                            ]}>
                              {item}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <View style={s.btnWrapper}>
                      {checklistStep < checklistItems.length ? (
                        <BigButton 
                          label="MARK STEP COMPLETE" 
                          onPress={handleMarkStepComplete} 
                          variant="primary" 
                          icon="check" 
                        />
                      ) : (
                        <BigButton 
                          label="PROCEED TO FINAL REVIEW" 
                          onPress={() => setState('FINISHING')} 
                          variant="success" 
                          icon="arrow-right" 
                        />
                      )}
                    </View>
                  </View>
                );
              })()
            )}

            {/* 8. FINISHING STATE (Photo Upload Proof) */}
            {isOnline && state === 'FINISHING' && (
              <View style={s.jobOfferContainer}>
                <View style={s.finishHeader}>
                  <MaterialCommunityIcons name="camera-enhance-outline" size={20} color={T.primary} />
                  <Text style={s.finishTitle}>Proof of Work</Text>
                </View>
                <Text style={s.finishSubtitle}>Take clear photos to complete verification for this booking.</Text>
                
                {/* 3 Photo Tiles */}
                <View style={s.photoTilesRow}>
                  {(['before', 'during', 'after'] as const).map((type) => (
                    <TouchableOpacity 
                      key={type} 
                      style={s.photoTile}
                      onPress={() => handleUploadPhotoForType(type)}
                      activeOpacity={0.8}
                    >
                      {uploadedPhotos[type] ? (
                        <View style={s.photoTileFilled}>
                          <Image source={{ uri: uploadedPhotos[type] }} style={s.photoTileImage} />
                          <View style={s.photoTileCheck}>
                            <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                          </View>
                        </View>
                      ) : (
                        <View style={s.photoTileEmpty}>
                          <MaterialCommunityIcons name="camera-plus-outline" size={24} color={T.text3} />
                          <Text style={s.photoTileLabel}>{type}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Slide to Complete Job */}
                <View style={s.sliderActionBlock}>
                  <SwipeToComplete 
                    text="Slide to Complete Job 🏁" 
                    onComplete={() => {
                      updateBackendStatus('completed');
                      setState('COMPLETED');
                      setUploadedPhotos({});
                    }} 
                    activeTrackColor="#10B981"
                    icon="check-all"
                  />
                </View>
              </View>
            )}

            {/* 9. COMPLETED STATE */}
            {isOnline && state === 'COMPLETED' && (
              <View style={s.centerStateContainer}>
                <View style={[s.iconHalo, { backgroundColor: T.successLight }]}>
                  <MaterialCommunityIcons name="check-decagram" size={56} color={T.success} />
                </View>
                <Text style={s.stateTitle}>Job Completed!</Text>
                <Text style={s.stateSubtitle}>Excellent work! Earnings have been credited to your company balance.</Text>
                
                <View style={s.earningsSummaryCard}>
                  <Text style={s.earningsLabel}>TOTAL EARNED</Text>
                  <Text style={s.earningsAmount}>+${activeBooking?.totalPrice || "35.00"}</Text>
                </View>

                <View style={s.btnWrapper}>
                  <BigButton 
                    label="FIND NEXT JOB" 
                    onPress={() => {
                      setActiveBooking(null);
                      setState('LOADING');
                      loadJobs();
                    }} 
                    variant="primary" 
                    icon="magnify" 
                  />
                </View>
              </View>
            )}

          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },

  /* Floating Header */
  floatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
  },
  floatingHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  statusPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusCapsuleOnline: {
    backgroundColor: '#ECFDF5',
  },
  statusCapsuleOffline: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusCapsuleText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  toggleSegment: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 3,
    gap: 2,
  },
  toggleSegmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 13,
    gap: 4,
  },
  toggleSegmentBtnActive: {
    backgroundColor: '#0F172A',
  },
  toggleSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleSegmentTextActive: {
    color: '#FFFFFF',
  },

  /* Offline Banner */
  offlineBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  offlineBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Bottom Sheet Container */
  bottomSheet: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 92 : 80,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 20,
  },
  bottomSheetCollapsed: {
    paddingBottom: 10,
    paddingTop: 8,
  },
  sheetHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
  },
  collapsedSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  collapsedStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  collapsedSummaryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sheetScrollContent: {
    paddingTop: 8,
    paddingBottom: 4,
  },

  /* Generic State Views */
  centerStateContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  loadingRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  stateSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },

  /* Searching Radar */
  radarOuterCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  radarMiddleCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCenterDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    marginBottom: 10,
  },
  pulsingGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  searchingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.8,
  },

  /* Job Offer / Dispatch UI */
  jobOfferContainer: {
    width: '100%',
  },
  dispatchAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  dispatchAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  dispatchAlertText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  payoutBlock: {
    alignItems: 'flex-end',
  },
  payoutAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  payoutSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  offerCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  offerCategoryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  offerPricePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  offerPriceText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  offerServiceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    marginBottom: 8,
  },

  /* Chips */
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },

  /* Customer Profile Card */
  customerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  customerRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  /* Location Card */
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  locationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
    marginTop: 2,
  },

  /* En Route Navigation Header */
  enRouteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  enRoutePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  enRouteBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  enRouteEta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  /* Buttons & Sliders */
  sliderActionBlock: {
    width: '100%',
    marginTop: 12,
    gap: 8,
  },
  declineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
  },
  declineButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },
  mapsOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  mapsOutlineBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
  },
  btnWrapper: {
    width: '100%',
    marginTop: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  bigBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bigBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* Working Checklist */
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTaskTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressStepCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  progressPercentBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  stepsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 14,
  },
  stepCardActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  stepCardDone: {
    backgroundColor: '#F8FAFC',
    opacity: 0.65,
  },
  stepCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepCheckboxActive: {
    borderColor: '#4F46E5',
  },
  stepCheckboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  stepTitleActive: {
    color: '#4F46E5',
  },
  stepTitleDone: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },

  /* Finishing Photos */
  finishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  finishTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  finishSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  photoTilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  photoTile: {
    flex: 1,
    height: 90,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  photoTileEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoTileLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  photoTileFilled: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photoTileImage: {
    width: '100%',
    height: '100%',
  },
  photoTileCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Completed State */
  earningsSummaryCard: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 20,
    marginVertical: 14,
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },

  /* Markers */
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerContainerSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#FFFFFF',
  },
  markerContainerActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  /* List View */
  listContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: { fontSize: 12, fontWeight: '800', color: '#4F46E5' },
  emptyState: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  emptyText: { fontSize: 13, color: '#94A3B8', textAlign: 'center', fontWeight: '500', paddingHorizontal: 32 },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  jobCardService: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  metaChipsRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  miniChipText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  jobCardPriceContainer: { alignItems: 'flex-end' },
  jobCardPrice: { fontSize: 18, fontWeight: '900', color: '#10B981' },
  jobCardPriceLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  jobCardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  jobCardAddress: { fontSize: 12, color: '#475569', fontWeight: '600', flex: 1 },
  jobCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  claimLink: { fontSize: 13, fontWeight: '800', color: '#4F46E5' },
});

const mapStyle = [
  { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#E2E8F0" }] }
];
