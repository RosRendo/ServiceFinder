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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');

type MachineState = 'LOADING' | 'WAITING' | 'NEW_JOB' | 'NEW_REQUEST' | 'OFFER_SENT' | 'TRAVELING' | 'ARRIVED' | 'WORKING' | 'FINISHING' | 'COMPLETED';

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

  // Ultra-premium dark theme colors
  const T = { bg: '#F7F8FC', surface: '#FFFFFF', text1: '#0A192F', text2: '#475569', text3: '#94A3B8', accent: '#0A192F', success: '#00A699', border: '#E8EEF4', danger: '#EF4444' };

  // Pulse animation for waiting state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (state === 'WAITING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }

    // Auto zoom map to show route when traveling
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
              latitude: c[1], // OSRM returns [longitude, latitude]
              longitude: c[0]
            }));
            setRouteCoords(coords);
            
            setTimeout(() => {
              mapRef.current?.fitToCoordinates(coords, {
                edgePadding: { top: 100, right: 50, bottom: Dimensions.get('window').height / 2, left: 50 },
                animated: true,
              });
            }, 500);
          } else {
             // Fallback
             mapRef.current?.fitToCoordinates([
                { latitude: startLat, longitude: startLng },
                { latitude: endLat, longitude: endLng }
             ], { edgePadding: { top: 100, right: 50, bottom: Dimensions.get('window').height / 2, left: 50 }, animated: true });
          }
        } catch (e) {
          console.warn("OSRM Routing failed:", e);
        }
      })();
    } else {
       setRouteCoords([]);
    }
  }, [state, location, activeBooking]);

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

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          setLocation(loc);
        }
      } catch (e) {
        console.warn("Location not available:", e);
      }

      loadJobs();
    })();
  }, []);

  const updateBackendStatus = async (newStatus: string) => {
    if (!activeBooking?.id) return;
    if (activeBooking.id.toString() === '999') {
      console.log(`[Simulation] Bypassing backend update for mock booking 999. New status: ${newStatus}`);
      return;
    }

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
    setState('TRAVELING');
  };

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

      if (activeBooking.id.toString() === '999') {
        console.log(`[Simulation] Bypassing progress sync for mock booking 999.`);
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
                if (activeBooking.id.toString() === '999') {
                  console.log(`[Simulation] Bypassing photo upload API for mock booking 999.`);
                  return;
                }
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

  const BigButton = ({ label, onPress, color = T.accent, textColor = '#fff', icon, outline = false }: any) => (
    <TouchableOpacity 
      style={[
        s.bigBtn, 
        outline ? { backgroundColor: 'transparent', borderWidth: 2, borderColor: color } : { backgroundColor: color }
      ]} 
      onPress={onPress} 
      activeOpacity={0.85}
    >
      {icon && <MaterialCommunityIcons name={icon} size={24} color={outline ? color : textColor} style={{ marginRight: 8 }} />}
      <Text style={[s.bigBtnText, { color: outline ? color : textColor }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.root}>
      {/* Background Map or List View depending on Mode */}
      {state === 'WAITING' && viewMode === 'list' ? (
        <ScrollView style={[s.listContainer, { marginTop: insets.top + 80, marginBottom: insets.bottom + 120 }]} contentContainerStyle={{ padding: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
          <Text style={s.listTitle}>Available Jobs ({availableJobs.length})</Text>
          {availableJobs.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-search" size={48} color={T.text3} />
              <Text style={s.emptyText}>No jobs available in your area right now.</Text>
            </View>
          ) : (
            availableJobs.map((job) => (
              <TouchableOpacity 
                key={job.id} 
                style={s.jobCard} 
                onPress={() => setSelectedJob(job)}
                activeOpacity={0.9}
              >
                <View style={s.jobCardHeader}>
                  <Text style={s.jobCardService}>{job.service?.name || "Service"}</Text>
                  <Text style={s.jobCardPrice}>${job.totalPrice || "35.00"}</Text>
                </View>
                
                <Text style={s.jobCardAddress} numberOfLines={1}>{job.serviceAddress || "Address hidden"}</Text>
                
                <View style={s.jobCardFooter}>
                  <View style={s.cardMeta}>
                    <MaterialCommunityIcons name="calendar" size={14} color={T.text3} />
                    <Text style={s.cardMetaText}>{new Date(job.bookingDate).toLocaleDateString()}</Text>
                  </View>
                  <Text style={s.claimLink}>View Details →</Text>
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
          customMapStyle={mapStyle} // Cleaner map style
          initialRegion={{
            latitude: location?.coords.latitude || 0,
            longitude: location?.coords.longitude || 0,
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
               <View style={s.markerContainer}>
                  <View style={s.markerDot} />
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
               <View style={[s.markerContainer, { backgroundColor: selectedJob?.id === job.id ? 'rgba(0, 166, 153, 0.4)' : 'rgba(0, 166, 153, 0.2)' }]}>
                  <View style={[s.markerDot, { backgroundColor: selectedJob?.id === job.id ? '#0A192F' : '#00A699' }]} />
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
               strokeColor={T.accent}
               strokeWidth={4}
             />
          )}
        </MapView>
      )}

      {/* Floating Header */}
      <View style={[s.floatingHeader, { top: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={s.headerPill}>
            <View style={[s.statusDot, { backgroundColor: isOnline ? T.success : T.text3 }]} />
            <Text style={s.headerPillText}>{isOnline ? 'Available' : 'Offline'}</Text>
          </View>
          <View style={s.headerPill}>
            <View style={[s.statusDot, { backgroundColor: isOffline ? T.danger : T.success }]} />
            <Text style={s.headerPillText}>{isOffline ? 'No Internet' : 'Connected'}</Text>
          </View>
          
          {isOnline && state === 'WAITING' && (
            <View style={s.togglePill}>
              <TouchableOpacity 
                style={[s.toggleTab, viewMode === 'map' && s.toggleTabActive]} 
                onPress={() => setViewMode('map')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="map" size={18} color={viewMode === 'map' ? '#fff' : T.text2} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[s.toggleTab, viewMode === 'list' && s.toggleTabActive]} 
                onPress={() => setViewMode('list')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="format-list-bulleted" size={18} color={viewMode === 'list' ? '#fff' : T.text2} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Offline Banner Indicator */}
      {isOffline && (
        <View style={[s.offlineBanner, { top: insets.top + 70 }]}>
          <MaterialCommunityIcons name="cloud-off-outline" size={16} color="#fff" />
          <Text style={s.offlineBannerText}>Working Offline · Changes will sync when online</Text>
        </View>
      )}

      {/* The Bottom Sheet - Core UI Anchor */}
      <View style={[
        s.bottomSheet, 
        isCollapsed ? { height: 50, paddingBottom: 0, paddingTop: 6 } : null
      ]}>
        <TouchableOpacity 
          style={s.sheetHandleContainer} 
          onPress={() => setIsCollapsed(!isCollapsed)}
          activeOpacity={0.8}
        >
          <View style={s.sheetHandle} />
          <MaterialCommunityIcons 
            name={isCollapsed ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#94A3B8" 
            style={{ marginTop: 2 }} 
          />
        </TouchableOpacity>

        {!isCollapsed && (
          <>

        {isOnline && state === 'LOADING' && (
          <View style={s.sheetContent}>
            <ActivityIndicator size="large" color={T.accent} />
            <Text style={s.loadingText}>Syncing schedule...</Text>
          </View>
        )}

        {!isOnline && (
          <View style={s.sheetContent}>
            <Text style={s.sheetTitle}>You are Offline</Text>
            <Text style={s.sheetSub}>Go online to start receiving company jobs.</Text>
            <View style={s.btnWrapper}>
              <BigButton label="GO ONLINE" onPress={() => setIsOnline(true)} color={T.success} icon="power" />
            </View>
          </View>
        )}

        {isOnline && state === 'WAITING' && (
          <View style={s.sheetContent}>
            {!selectedJob ? (
               <>
                 <Animated.View style={[s.radarCircle, { transform: [{ scale: pulseAnim }] }]}>
                   <View style={s.radarInner}>
                      <MaterialCommunityIcons name="radar" size={32} color={T.success} />
                   </View>
                 </Animated.View>
                 <Text style={s.sheetTitle}>Finding Jobs</Text>
                 <Text style={[s.sheetSub, { marginTop: 4, marginBottom: 12 }]}>Found {availableJobs.length} nearby jobs from your company. Tap a pin on the map or use List View.</Text>
                 
                 {/* Nearby Opportunities */}
                 <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: '#E8EEF4', paddingTop: 12, marginBottom: 8 }}>
                   <Text style={{ fontSize: 13, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                     ⚡ Nearby Company Jobs
                   </Text>
                   <TouchableOpacity 
                     style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' }}
                     onPress={() => setState('NEW_REQUEST')}
                   >
                     <MaterialCommunityIcons name="lightning-bolt" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
                     <View>
                       <Text style={{ fontSize: 14, fontWeight: '700', color: '#0A192F' }}>AC Maintenance (Instant)</Text>
                       <Text style={{ fontSize: 12, color: '#64748B' }}>1.8 km away · Est: $45-$60</Text>
                     </View>
                     <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" style={{ marginLeft: 'auto' }} />
                   </TouchableOpacity>
                 </View>

                 <View style={[s.btnWrapper, { marginTop: 16 }]}>
                   <BigButton label="GO OFFLINE" onPress={() => setIsOnline(false)} outline color={T.danger} />
                 </View>
               </>
            ) : (
               <View style={{ width: '100%' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={s.badgeLabel}>COMPANY JOB POOL</Text>
                    <View style={s.priceTag}>
                      <Text style={s.priceTagText}>${selectedJob.totalPrice || "35.00"}</Text>
                    </View>
                  </View>

                  <Text style={s.jobTitle}>{selectedJob.service?.name || "Service"}</Text>
                  
                  <View style={s.pillsContainer}>
                    <View style={s.infoPill}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color={T.text2} />
                      <Text style={s.infoPillText}>Nearby</Text>
                    </View>
                    <View style={s.infoPill}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={T.text2} />
                      <Text style={s.infoPillText}>
                        {selectedJob.service?.durationMin || 60} mins
                      </Text>
                    </View>
                  </View>

                  <View style={s.addressBox}>
                    <MaterialCommunityIcons name="map-marker" size={18} color={T.success} style={{ marginRight: 8 }} />
                    <Text style={s.addressBoxText} numberOfLines={2}>
                      {selectedJob.serviceAddress || "Address hidden"}
                    </Text>
                  </View>
                  
                  <View style={[s.rowBtns, { marginTop: 24 }]}>
                    <View style={{ flex: 1 }}>
                      <BigButton label="CLOSE" onPress={() => setSelectedJob(null)} outline color={T.text3} />
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={{ flex: 2 }}>
                      <BigButton label="CLAIM & START" onPress={() => handlePickJob(selectedJob)} color={T.success} icon="navigation" />
                    </View>
                  </View>
               </View>
            )}
          </View>
        )}

        {isOnline && state === 'NEW_JOB' && (
          (() => {
            const distance = location && activeBooking?.latitude && activeBooking?.longitude
              ? `${getDistance(location.coords.latitude, location.coords.longitude, Number(activeBooking.latitude), Number(activeBooking.longitude))} mi`
              : "Nearby";
            
            const durationMin = activeBooking?.service?.durationMin || 120;
            const durationText = durationMin >= 60 
              ? `${(durationMin / 60).toFixed(1)} Hours` 
              : `${durationMin} Mins`;

            const customerName = activeBooking?.customer?.fullName || "Customer";
            const initials = customerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

            return (
              <View style={s.sheetContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                  <Text style={s.badgeLabelAmber}>ASSIGNED DISPATCH</Text>
                  <View style={s.priceTag}>
                    <Text style={s.priceTagText}>${activeBooking?.totalPrice || "35.00"}</Text>
                  </View>
                </View>

                <Text style={s.jobTitle}>{activeBooking?.service?.name || "Service"}</Text>

                <View style={s.pillsContainer}>
                  <View style={s.infoPill}>
                    <MaterialCommunityIcons name="map-marker-distance" size={14} color={T.text2} />
                    <Text style={s.infoPillText}>{distance}</Text>
                  </View>
                  <View style={s.infoPill}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={T.text2} />
                    <Text style={s.infoPillText}>{durationText}</Text>
                  </View>
                </View>

                <View style={s.clientCard}>
                  <View style={s.clientAvatar}>
                    <Text style={s.clientAvatarText}>{initials}</Text>
                  </View>
                  <View style={s.clientInfo}>
                    <Text style={s.clientName}>{customerName}</Text>
                    <Text style={s.clientLabel}>Customer Assignment</Text>
                  </View>
                </View>

                <View style={s.addressBox}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={T.success} style={{ marginRight: 8 }} />
                  <Text style={s.addressBoxText} numberOfLines={2}>
                    {activeBooking?.serviceAddress || "Address Hidden"}
                  </Text>
                </View>
                
                <View style={[s.rowBtns, { marginTop: 24 }]}>
                  <View style={{ flex: 1 }}>
                    <BigButton label="DECLINE" onPress={handleDecline} outline color={T.text3} />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 2 }}>
                    <BigButton label="ACCEPT & TRAVEL" onPress={handleAccept} color={T.success} icon="navigation" />
                  </View>
                </View>
              </View>
            );
          })()
        )}

        {isOnline && state === 'NEW_REQUEST' && (
          <View style={s.sheetContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
              <Text style={s.badgeLabel}>⚡ INSTANT HELP REQUEST</Text>
              <View style={s.priceTag}>
                <Text style={s.priceTagText}>Est: $45–60</Text>
              </View>
            </View>

            <Text style={s.jobTitle}>Need Help Now: AC Maintenance</Text>
            
            <View style={s.pillsContainer}>
              <View style={s.infoPill}>
                <MaterialCommunityIcons name="map-marker-distance" size={14} color={T.text2} />
                <Text style={s.infoPillText}>1.8 km away</Text>
              </View>
              <View style={s.infoPill}>
                <MaterialCommunityIcons name="clock-alert-outline" size={14} color={T.text2} />
                <Text style={s.infoPillText}>Immediate (30s timer)</Text>
              </View>
            </View>

            <View style={s.addressBox}>
              <MaterialCommunityIcons name="map-marker" size={18} color={T.success} style={{ marginRight: 8 }} />
              <Text style={s.addressBoxText} numberOfLines={2}>
                BKK1, Street 278, Phnom Penh
              </Text>
            </View>

            <View style={s.clientCard}>
              <View style={s.clientAvatar}>
                <Text style={s.clientAvatarText}>JD</Text>
              </View>
              <View style={s.clientInfo}>
                <Text style={s.clientName}>John Doe</Text>
                <Text style={s.clientLabel}>"AC is making a loud noise and blowing warm air."</Text>
              </View>
            </View>
            
            <View style={[s.rowBtns, { marginTop: 24 }]}>
              <View style={{ flex: 1 }}>
                <BigButton label="DECLINE" onPress={() => setState('WAITING')} outline color={T.text3} />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 2 }}>
                <BigButton label="SEND OFFER ($50)" onPress={() => setState('OFFER_SENT')} color={T.success} icon="send" />
              </View>
            </View>
          </View>
        )}

        {isOnline && state === 'OFFER_SENT' && (
          <View style={s.sheetContent}>
             <View style={s.successCircleContainer}>
               <MaterialCommunityIcons name="timer-sand" size={48} color="#F59E0B" />
             </View>
             <Text style={s.jobTitle}>Offer Sent!</Text>
             <Text style={[s.sheetSub, { marginBottom: 24, marginTop: 4 }]}>
               Waiting for the customer to review bids and select a provider.
             </Text>
             <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
               <View style={{ flex: 1 }}>
                 <BigButton label="CANCEL OFFER" onPress={() => setState('WAITING')} outline color={T.danger} />
               </View>
               <View style={{ flex: 1.5 }}>
                 <BigButton label="SIMULATE SELECT" onPress={() => {
                   setActiveBooking({
                     id: 999,
                     status: 'confirmed',
                     latitude: location?.coords.latitude || 0,
                     longitude: location?.coords.longitude || 0,
                     serviceAddress: "BKK1, Street 278, Phnom Penh",
                     totalPrice: 50.00,
                     customer: { fullName: "John Doe" },
                     service: { name: "Instant AC Repair", durationMin: 60 }
                   });
                   setState('TRAVELING');
                 }} color={T.success} icon="lightning-bolt" />
               </View>
             </View>
          </View>
        )}

        {isOnline && state === 'TRAVELING' && (
          (() => {
            const customerName = activeBooking?.customer?.fullName || "Customer";
            const initials = customerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

            return (
              <View style={s.sheetContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 }}>
                  <MaterialCommunityIcons name="navigation-variant" size={20} color={T.success} style={{ marginRight: 6 }} />
                  <Text style={[s.badgeLabel, { color: T.success, backgroundColor: 'rgba(0,166,153,0.1)' }]}>EN ROUTE TO CUSTOMER</Text>
                </View>

                <View style={s.clientCard}>
                  <View style={s.clientAvatar}>
                    <Text style={s.clientAvatarText}>{initials}</Text>
                  </View>
                  <View style={s.clientInfo}>
                    <Text style={s.clientName}>{customerName}</Text>
                    <Text style={s.clientLabel}>Waiting for arrival</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={s.actionCircleBtn} onPress={handlePhoneCall} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="phone" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionCircleBtn} onPress={handleChat} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="message-text" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={s.addressBox}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={T.success} style={{ marginRight: 8 }} />
                  <Text style={s.addressBoxText} numberOfLines={2}>
                    {activeBooking?.serviceAddress || "Address Loading..."}
                  </Text>
                </View>
                
                <View style={[s.rowBtns, { marginTop: 16 }]}>
                  <View style={{ flex: 1 }}>
                    <BigButton label="MAPS" onPress={handleNavigate} outline color={T.text2} icon="map" />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 2 }}>
                    <BigButton label="CHECK IN" onPress={() => {
                      updateBackendStatus('arrived');
                      setState('ARRIVED');
                    }} color={T.success} icon="check" />
                  </View>
                </View>
              </View>
            );
          })()
        )}

        {isOnline && state === 'ARRIVED' && (
          <View style={[s.sheetContent, { paddingVertical: 12 }]}>
             <View style={s.successCircleContainer}>
               <MaterialCommunityIcons name="map-marker-check" size={56} color={T.success} />
             </View>
             <Text style={s.jobTitle}>You've Arrived!</Text>
             <Text style={[s.sheetSub, { marginBottom: 24, marginTop: 4 }]}>
               Meet the client and initiate the task steps.
             </Text>
             <View style={s.btnWrapper}>
                <BigButton label="START WORK" onPress={() => {
                  updateBackendStatus('in_progress');
                  setState('WORKING');
                }} color={T.accent} icon="play" />
             </View>
          </View>
        )}

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
                  "Upload Photos"
                ];

            const pct = Math.round((checklistStep / checklistItems.length) * 100);
            
            return (
              <View style={s.sheetContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={s.jobTitle}>{activeBooking?.service?.name || "Active Task"}</Text>
                  <View style={s.progressBadge}>
                    <Text style={s.progressBadgeText}>{pct}% Done</Text>
                  </View>
                </View>

                <View style={s.sheetProgressBar}>
                  <View style={[s.sheetProgressBarFill, { width: `${pct}%` }]} />
                </View>
                
                <View style={s.checklistCard}>
                  {checklistItems.map((item: string, idx: number) => {
                    const isDone = checklistStep > idx;
                    const isActive = checklistStep === idx;
                    return (
                      <View 
                        key={idx} 
                        style={[
                          s.checklistItemCard, 
                          isDone && s.checklistItemCardDone,
                          isActive && s.checklistItemCardActive
                        ]}
                      >
                        <View style={[s.checkCirclePill, isDone && s.checkCirclePillDone]}>
                            {isDone && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                        </View>
                        <Text style={[s.checkTextPill, isDone && s.checkTextPillDone]}>{item}</Text>
                      </View>
                    );
                  })}
                </View>

                <View style={s.btnWrapper}>
                  {checklistStep < checklistItems.length ? (
                    <BigButton label="MARK STEP COMPLETE" onPress={handleMarkStepComplete} icon="check" />
                  ) : (
                    <BigButton label="PROCEED TO FINISH" onPress={() => setState('FINISHING')} color={T.success} icon="arrow-right" />
                  )}
                </View>
              </View>
            );
          })()
        )}

        {isOnline && state === 'FINISHING' && (
          <View style={s.sheetContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 12 }}>
              <MaterialCommunityIcons name="clipboard-check" size={20} color={T.accent} style={{ marginRight: 6 }} />
              <Text style={s.badgeLabel}>FINAL SIGN OFF</Text>
            </View>
            <Text style={[s.jobTitle, { alignSelf: 'flex-start' }]}>Complete Service</Text>
            <Text style={[s.sheetSub, { alignSelf: 'flex-start', marginBottom: 12 }]}>Provide evidence photos to complete the job.</Text>
            
            <View style={{ flexDirection: 'row', gap: 12, width: '100%', marginBottom: 20 }}>
              {(['before', 'during', 'after'] as const).map((type) => (
                <TouchableOpacity 
                  key={type} 
                  style={{ flex: 1, height: 80, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                  onPress={() => handleUploadPhotoForType(type)}
                >
                  {uploadedPhotos[type] ? (
                    <Image source={{ uri: uploadedPhotos[type] }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="camera" size={20} color="#94A3B8" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', marginTop: 2, textTransform: 'capitalize' }}>{type}</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.btnWrapper}>
              <BigButton label="SUBMIT & CLOSE JOB" onPress={() => {
                updateBackendStatus('completed');
                setState('COMPLETED');
                setUploadedPhotos({});
              }} color={T.success} icon="check-all" />
            </View>
          </View>
        )}

        {isOnline && state === 'COMPLETED' && (
          <View style={s.sheetContent}>
             <View style={s.successCircle}>
                <MaterialCommunityIcons name="check-decagram" size={64} color={T.success} />
             </View>
             <Text style={s.sheetTitle}>Job Completed!</Text>
             <Text style={s.sheetSub}>Great work today.</Text>
             <View style={s.priceBadge}>
                <Text style={s.priceText}>+${activeBooking?.totalPrice || "35.00"}</Text>
             </View>
             <View style={s.btnWrapper}>
               <BigButton label="FIND NEXT JOB" onPress={() => {
                 setActiveBooking(null);
                 setState('LOADING');
                 loadJobs();
               }} />
             </View>
             </View>
           )}
         </>
       )}
     </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F8FC' },
  
  floatingHeader: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: {width:0, height:4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  headerPillText: { fontSize: 14, fontWeight: '800', color: '#0A192F', letterSpacing: 0.5 },

  bottomSheet: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 80,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 20,
  },
  sheetHandleContainer: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHandle: { 
    width: 40, 
    height: 4, 
    backgroundColor: '#E8EEF4', 
    borderRadius: 2,
  },
  sheetContent: { alignItems: 'center', width: '100%' },
  
  sheetTitle: { fontSize: 28, fontWeight: '900', color: '#0A192F', textAlign: 'center', letterSpacing: -0.5 },
  sheetSub: { fontSize: 16, color: '#475569', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  
  btnWrapper: { width: '100%', marginTop: 32 },
  
  bigBtn: { width: '100%', height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  bigBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  
  radarCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0, 166, 153, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  radarInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0, 166, 153, 0.2)', alignItems: 'center', justifyContent: 'center' },
  
  priceBadge: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(0, 166, 153, 0.1)', borderRadius: 24, marginBottom: 16 },
  priceText: { fontSize: 24, fontWeight: '900', color: '#00A699' },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  metaText: { fontSize: 15, fontWeight: '700', color: '#475569' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94A3B8' },
  
  rowBtns: { flexDirection: 'row', width: '100%', marginTop: 24 },
  iconBtn: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#F0F4F8', alignItems: 'center', justifyContent: 'center' },
  
  checklistCard: { width: '100%', marginTop: 24, gap: 16 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E8EEF4', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  checkCircleActive: { backgroundColor: '#00A699', borderColor: '#00A699' },
  checkText: { fontSize: 18, fontWeight: '700', color: '#0A192F' },
  checkTextDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
  
  successCircle: { marginBottom: 16 },
  loadingText: { marginTop: 16, fontSize: 15, fontWeight: '600', color: '#94A3B8' },

  markerContainer: { width: 40, height: 40, backgroundColor: 'rgba(10, 25, 47, 0.1)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  markerDot: { width: 16, height: 16, backgroundColor: '#0A192F', borderRadius: 8, borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 4 },
  
  listContainer: { flex: 1, backgroundColor: '#F7F8FC' },
  listTitle: { fontSize: 22, fontWeight: '800', color: '#0A192F', marginBottom: 12 },
  emptyState: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#94A3B8', textAlign: 'center', fontWeight: '600' },
  jobCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: {width:0, height:8}, shadowOpacity: 0.04, shadowRadius: 20, elevation: 2, marginBottom: 16 },
  jobCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobCardService: { fontSize: 17, fontWeight: '800', color: '#0A192F', flex: 1, marginRight: 8 },
  jobCardPrice: { fontSize: 18, fontWeight: '900', color: '#00A699' },
  jobCardAddress: { fontSize: 14, color: '#475569', marginTop: 6, fontWeight: '500' },
  jobCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  claimLink: { fontSize: 14, fontWeight: '800', color: '#0A192F' },

  togglePill: { flexDirection: 'row', backgroundColor: '#fff', padding: 4, borderRadius: 32, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  toggleTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  toggleTabActive: { backgroundColor: '#0A192F' },

  offlineBanner: { position: 'absolute', left: 24, right: 24, backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 9, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  offlineBannerText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  previewCard: { width: '100%', backgroundColor: '#F0F4F8', borderRadius: 20, padding: 16, marginTop: 16, alignItems: 'center' },
  previewLabel: { fontSize: 13, fontWeight: '800', color: '#475569', marginBottom: 8, letterSpacing: 0.5 },
  previewImage: { width: '100%', height: 160, borderRadius: 12 },
  changePhotoBtn: { marginTop: 10, paddingVertical: 4, paddingHorizontal: 12 },
  changePhotoText: { fontSize: 14, fontWeight: '700', color: '#00A699' },

  badgeLabel: { fontSize: 11, fontWeight: '800', color: '#00A699', backgroundColor: 'rgba(0,166,153,0.1)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, letterSpacing: 0.8 },
  badgeLabelAmber: { fontSize: 11, fontWeight: '800', color: '#D97706', backgroundColor: 'rgba(217,119,6,0.1)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, letterSpacing: 0.8 },
  priceTag: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#00A699', borderRadius: 16 },
  priceTagText: { fontSize: 16, fontWeight: '900', color: '#fff' },
  jobTitle: { fontSize: 22, fontWeight: '900', color: '#0A192F', letterSpacing: -0.5, width: '100%' },
  pillsContainer: { flexDirection: 'row', width: '100%', gap: 8, marginTop: 8 },
  infoPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, gap: 4 },
  infoPillText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  addressBox: { flexDirection: 'row', width: '100%', backgroundColor: '#F7F8FC', borderWidth: 1, borderColor: '#E8EEF4', borderRadius: 16, padding: 14, marginTop: 16, alignItems: 'center' },
  addressBoxText: { fontSize: 13, fontWeight: '600', color: '#475569', flex: 1, lineHeight: 18 },
  clientCard: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8EEF4', borderRadius: 18, padding: 12, marginTop: 16 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0A192F', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  clientAvatarText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '800', color: '#0A192F' },
  clientLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  actionCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0A192F', alignItems: 'center', justifyContent: 'center' },
  progressBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(0,166,153,0.1)', borderRadius: 10 },
  progressBadgeText: { fontSize: 12, fontWeight: '800', color: '#00A699' },
  sheetProgressBar: { width: '100%', height: 6, backgroundColor: '#F0F4F8', borderRadius: 3, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
  sheetProgressBarFill: { height: '100%', backgroundColor: '#00A699', borderRadius: 3 },
  checklistItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F8FC', borderWidth: 1, borderColor: '#E8EEF4', padding: 14, borderRadius: 16, marginBottom: 10 },
  checklistItemCardActive: { borderColor: '#0A192F', backgroundColor: '#FFF' },
  checklistItemCardDone: { opacity: 0.6, backgroundColor: '#F7F8FC' },
  checkCirclePill: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkCirclePillDone: { backgroundColor: '#00A699', borderColor: '#00A699' },
  checkTextPill: { fontSize: 15, fontWeight: '700', color: '#0A192F' },
  checkTextPillDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
  successCircleContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,166,153,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  premiumPreviewCard: { width: '100%', height: 200, borderRadius: 20, overflow: 'hidden', marginTop: 16, position: 'relative' },
  premiumPreviewImage: { width: '100%', height: '100%' },
  premiumChangePhotoBtn: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(10,25,47,0.75)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  premiumChangePhotoText: { fontSize: 12, fontWeight: '800', color: '#fff' }
});

const mapStyle = [
  { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#E8EEF4" }] }
];
