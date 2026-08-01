import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Animated, Platform, Alert, Linking, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import SwipeToComplete from '../../../components/SwipeToComplete';
import api from '../../../utils/api';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

type MachineState = 'LOADING' | 'OFFLINE' | 'WAITING' | 'NEW_JOB' | 'TRAVELING' | 'ARRIVED' | 'WORKING' | 'FINISHING' | 'COMPLETED';

export default function TodayScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [state, setState] = useState<MachineState>('LOADING');
  const [checklistStep, setChecklistStep] = useState(0);
  const [uploadedPhotoUri, setUploadedPhotoUri] = useState<string | null>(null);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);

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
    try {
      if (newStatus === 'in_progress') await api.patch(`/api/bookings/${activeBooking.id}/start`);
      else if (newStatus === 'completed') {
        const payload: any = {};
        if (uploadedPhotoUri) payload.proofOfWorkPhoto = uploadedPhotoUri;
        await api.patch(`/api/bookings/${activeBooking.id}/complete`, payload);
      }
      else await api.patch(`/api/bookings/${activeBooking.id}/status`, { status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePickJob = async (job: any) => {
    try {
      const userRes = await api.get('/api/auth/me');
      let me = userRes.data?.data?.user || userRes.data?.user || userRes.data?.data || userRes.data;
      if (me?.staffProfile?.id) {
         await api.patch(`/api/bookings/${job.id}/assign-staff`, { staffId: me.staffProfile.id });
         setActiveBooking(job);
         setSelectedJob(null);
         setState('NEW_JOB');
      } else {
         Alert.alert("Error", "Could not find your staff profile.");
      }
    } catch (e) {
      console.error("Failed to pick job", e);
      Alert.alert("Error", "Could not assign job.");
    }
  };

  const handleAccept = async () => {
    setState('TRAVELING');
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
    router.push(`/(staff)/chat/${activeBooking.customerId}?otherName=${encodeURIComponent(name)}`);
  };

  const handleUploadPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "You need to grant media library permissions to upload photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadedPhotoUri(result.assets[0].uri);
        Alert.alert("Success", "Proof of work photo uploaded successfully.");
        setChecklistStep(0);
        setState('FINISHING');
      }
    } catch (e) {
      console.warn("Image picker error:", e);
      Alert.alert("Error", "Could not open camera roll.");
    }
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
      {/* Background Map - True Uber Style (Full Screen) */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={mapStyle} // Cleaner map style
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
               latitude: Number(activeBooking.latitude) || (location?.coords.latitude || 11.5564) + 0.01,
               longitude: Number(activeBooking.longitude) || (location?.coords.longitude || 104.9282) + 0.01
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
               latitude: Number(job.latitude) || (location?.coords.latitude || 11.5564) + (Math.random() * 0.02 - 0.01),
               longitude: Number(job.longitude) || (location?.coords.longitude || 104.9282) + (Math.random() * 0.02 - 0.01)
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
             strokeColor={T.primary}
             strokeWidth={4}
           />
        )}

        {/* Real Turn-by-Turn Route (Requires Real Google Maps API Key in .env) */}
        {/*
        {state === 'TRAVELING' && activeBooking && location && (
           <MapViewDirections 
             origin={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
             destination={{ latitude: Number(activeBooking.latitude), longitude: Number(activeBooking.longitude) }}
             apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
             strokeColor={T.accent}
             strokeWidth={4}
             onError={(error) => console.warn("Directions Error: ", error)}
           />
        )}
        */}
      </MapView>

      {/* Floating Header (Optional, for status summary) */}
      <View style={s.floatingHeader}>
        <View style={s.headerPill}>
          <View style={[s.statusDot, { backgroundColor: state === 'OFFLINE' ? T.text3 : T.success }]} />
          <Text style={s.headerPillText}>{state === 'OFFLINE' ? 'Offline' : state === 'WAITING' ? 'Online' : 'On Job'}</Text>
        </View>
      </View>

      {/* The Bottom Sheet - Core UI Anchor */}
      <View style={s.bottomSheet}>
        <View style={s.sheetHandle} />

        {state === 'LOADING' && (
          <View style={s.sheetContent}>
            <ActivityIndicator size="large" color={T.accent} />
            <Text style={s.loadingText}>Syncing schedule...</Text>
          </View>
        )}

        {state === 'OFFLINE' && (
          <View style={s.sheetContent}>
            <Text style={s.sheetTitle}>You are Offline</Text>
            <Text style={s.sheetSub}>Go online to start receiving jobs in your area.</Text>
            <View style={s.btnWrapper}>
              <BigButton label="GO ONLINE" onPress={() => setState('WAITING')} color={T.success} icon="power" />
            </View>
          </View>
        )}

        {state === 'WAITING' && (
          <View style={s.sheetContent}>
            {!selectedJob ? (
               <>
                 <Animated.View style={[s.radarCircle, { transform: [{ scale: pulseAnim }] }]}>
                   <View style={s.radarInner}>
                      <MaterialCommunityIcons name="radar" size={32} color={T.success} />
                   </View>
                 </Animated.View>
                 <Text style={s.sheetTitle}>Finding Jobs</Text>
                 <Text style={s.sheetSub}>Found {availableJobs.length} open jobs. Tap a pin on the map to view details.</Text>
                 
                 <View style={[s.btnWrapper, { marginTop: 24 }]}>
                   <BigButton label="GO OFFLINE" onPress={() => setState('OFFLINE')} outline color={T.danger} />
                 </View>
               </>
            ) : (
               <View style={{ width: '100%', alignItems: 'center' }}>
                  <View style={s.priceBadge}>
                    <Text style={s.priceText}>${selectedJob.totalPrice || "35.00"}</Text>
                  </View>
                  <Text style={s.sheetTitle}>{selectedJob.service?.name || "Service"}</Text>
                  
                  <View style={s.metaRow}>
                    <MaterialCommunityIcons name="map-marker-distance" size={18} color={T.text2} />
                    <Text style={s.metaText}>Nearby</Text>
                    <View style={s.metaDot} />
                    <MaterialCommunityIcons name="calendar" size={18} color={T.text2} />
                    <Text style={s.metaText}>{new Date(selectedJob.bookingDate).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[s.sheetSub, { textAlign: 'left', alignSelf: 'flex-start', marginTop: 16 }]}>
                    {selectedJob.serviceAddress || "Address hidden"}
                  </Text>
                  
                  <View style={[s.rowBtns, { marginTop: 32 }]}>
                    <View style={{ flex: 1 }}>
                      <BigButton label="CANCEL" onPress={() => setSelectedJob(null)} outline color={T.text3} />
                    </View>
                    <View style={{ width: 16 }} />
                    <View style={{ flex: 2 }}>
                      <BigButton label="PICK JOB" onPress={() => handlePickJob(selectedJob)} color={T.success} />
                    </View>
                  </View>
               </View>
            )}
          </View>
        )}

        {state === 'NEW_JOB' && (
          <View style={s.sheetContent}>
            <View style={s.priceBadge}>
              <Text style={s.priceText}>${activeBooking?.totalPrice || "35.00"}</Text>
            </View>
            <Text style={s.sheetTitle}>{activeBooking?.service?.name || "AC Cleaning"}</Text>
            <View style={s.metaRow}>
              <MaterialCommunityIcons name="map-marker-distance" size={18} color={T.text2} />
              <Text style={s.metaText}>3.2 mi</Text>
              <View style={s.metaDot} />
              <MaterialCommunityIcons name="clock-outline" size={18} color={T.text2} />
              <Text style={s.metaText}>2 Hours est.</Text>
            </View>
            <Text style={[s.sheetSub, { textAlign: 'left', alignSelf: 'flex-start', marginTop: 16 }]}>
              {activeBooking?.serviceAddress || "123 Customer Address, City, Country"}
            </Text>
            
            <View style={[s.rowBtns, { marginTop: 32 }]}>
              <View style={{ flex: 1 }}>
                <BigButton label="DECLINE" onPress={() => setState('WAITING')} outline color={T.text3} />
              </View>
              <View style={{ width: 16 }} />
              <View style={{ flex: 2 }}>
                <BigButton label="ACCEPT JOB" onPress={handleAccept} color={T.success} />
              </View>
            </View>
          </View>
        )}

        {state === 'TRAVELING' && (
          <View style={s.sheetContent}>
            <View style={s.metaRow}>
              <MaterialCommunityIcons name="navigation-variant" size={24} color={T.accent} />
              <Text style={s.sheetTitle}>En Route</Text>
            </View>
            <Text style={[s.sheetSub, { alignSelf: 'flex-start', marginTop: 8 }]}>
              {activeBooking?.serviceAddress || "Address loading..."}
            </Text>
            
            <View style={s.rowBtns}>
              <TouchableOpacity style={s.iconBtn} onPress={handlePhoneCall}>
                <MaterialCommunityIcons name="phone" size={24} color={T.text1} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={handleChat}>
                <MaterialCommunityIcons name="message-text" size={24} color={T.text1} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <BigButton label="NAVIGATE" onPress={handleNavigate} color={T.accent} />
              </View>
            </View>

            <View style={s.btnWrapper}>
              <SwipeToComplete text="SWIPE TO CHECK IN" onComplete={() => {
                updateBackendStatus('arrived');
                setState('ARRIVED');
              }} />
            </View>
          </View>
        )}

        {state === 'ARRIVED' && (
          <View style={s.sheetContent}>
             <MaterialCommunityIcons name="map-marker-check" size={48} color={T.success} />
             <Text style={s.sheetTitle}>You've Arrived</Text>
             <Text style={s.sheetSub}>Ready to begin the service?</Text>
             <View style={s.btnWrapper}>
                <BigButton label="START WORK" onPress={() => {
                  updateBackendStatus('in_progress');
                  setState('WORKING');
                }} color={T.accent} />
             </View>
          </View>
        )}

        {state === 'WORKING' && (
          (() => {
            const checklistItems = [
              "Arrive & Inspect Site", 
              `Perform: ${activeBooking?.service?.name || "Service"}`, 
              "Clean up & Verify", 
              "Upload Photos"
            ];
            
            return (
              <View style={s.sheetContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <Text style={s.sheetTitle}>{activeBooking?.service?.name || "Active Task"}</Text>
                  <Text style={{ fontWeight: '800', color: T.success, fontSize: 16 }}>In Progress</Text>
                </View>
                
                <View style={s.checklistCard}>
                  {checklistItems.map((item: string, idx: number) => (
                    <View key={idx} style={s.checklistItem}>
                      <View style={[s.checkCircle, checklistStep > idx && s.checkCircleActive]}>
                          {checklistStep > idx && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                      </View>
                      <Text style={[s.checkText, checklistStep > idx && s.checkTextDone]}>{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={s.btnWrapper}>
                  {checklistStep < checklistItems.length - 1 ? (
                    <BigButton label="MARK STEP COMPLETE" onPress={() => setChecklistStep(checklistStep + 1)} />
                  ) : (
                    <BigButton label="UPLOAD & FINISH" onPress={handleUploadPhoto} color={T.success} icon="camera" />
                  )}
                </View>
              </View>
            );
          })()
        )}

        {state === 'FINISHING' && (
          <View style={s.sheetContent}>
            <MaterialCommunityIcons name="clipboard-check" size={48} color={T.accent} />
            <Text style={s.sheetTitle}>Final Sign Off</Text>
            <Text style={s.sheetSub}>Present to customer for final approval.</Text>
            <View style={s.btnWrapper}>
              <SwipeToComplete text="SWIPE TO COMPLETE JOB" onComplete={() => {
                updateBackendStatus('completed');
                setState('COMPLETED');
                setUploadedPhotoUri(null);
              }} />
            </View>
          </View>
        )}

        {state === 'COMPLETED' && (
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
    bottom: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Dimensions.get('window').height > 800 ? 110 : 90, // Accounts for tab bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E8EEF4', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
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
  markerDot: { width: 16, height: 16, backgroundColor: '#0A192F', borderRadius: 8, borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.3, shadowRadius: 4 }
});

const mapStyle = [
  { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "transit", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#E8EEF4" }] }
];
