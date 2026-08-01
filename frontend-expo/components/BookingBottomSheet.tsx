import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, ScrollView, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/theme';
import ScaleButton from './ScaleButton';

const T = Theme.colors;

interface BookingBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  serviceId: string;
  price: number;
}

export default function BookingBottomSheet({ visible, onClose, serviceId, price }: BookingBottomSheetProps) {
  const router = useRouter();
  const [slideAnim] = useState(new Animated.Value(500));
  
  // Generate next 14 days dynamically
  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      let label = '';
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';
      else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      arr.push({ label, value: d.toISOString() });
    }
    return arr;
  }, []);

  // Generate time slots (8 AM to 6 PM)
  const times = useMemo(() => {
    const arr = [];
    for (let h = 8; h <= 18; h += 2) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h > 12 ? h - 12 : h;
      arr.push(`${hour.toString().padStart(2, '0')}:00 ${ampm}`);
    }
    return arr;
  }, []);
  
  const [date, setDate] = useState(dates[1].label); // Default Tomorrow
  const [time, setTime] = useState(times[1]); // Default 10:00 AM

  const isCustomDate = !dates.some(d => d.label === date);
  const isCustomTime = !times.includes(time);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const onDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    const formattedDate = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setDate(formattedDate);
  };

  const onTimeConfirm = (selectedDate: Date) => {
    setShowTimePicker(false);
    let h = selectedDate.getHours();
    const m = selectedDate.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    setTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`);
  };

  const onDateCancel = () => setShowDatePicker(false);
  const onTimeCancel = () => setShowTimePicker(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleCheckout = () => {
    onClose();
    // Pass temp state to checkout via query params (no ghost bookings in DB!)
    router.push({
      pathname: '/(customer)/checkout',
      params: { serviceId, date, time, price }
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.handle} />
          
          <Text style={s.title}>Select Date & Time</Text>
          
          <Text style={s.label}>Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollRow}>
            <TouchableOpacity style={[s.chip, isCustomDate && s.chipActive]} onPress={() => setShowDatePicker(true)}>
              <MaterialIcons name="calendar-today" size={16} color={isCustomDate ? T.accent : T.text2} style={{ marginRight: 6 }} />
              <Text style={[s.chipText, isCustomDate && s.chipTextActive]}>{isCustomDate ? date : "Custom"}</Text>
            </TouchableOpacity>
            {dates.map(d => (
              <TouchableOpacity key={d.label} style={[s.chip, date === d.label && s.chipActive]} onPress={() => setDate(d.label)}>
                <Text style={[s.chipText, date === d.label && s.chipTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <Text style={s.label}>Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollRow}>
            <TouchableOpacity style={[s.chip, isCustomTime && s.chipActive]} onPress={() => setShowTimePicker(true)}>
              <MaterialIcons name="access-time" size={16} color={isCustomTime ? T.accent : T.text2} style={{ marginRight: 6 }} />
              <Text style={[s.chipText, isCustomTime && s.chipTextActive]}>{isCustomTime ? time : "Custom"}</Text>
            </TouchableOpacity>
            {times.map(t => (
              <TouchableOpacity key={t} style={[s.chip, time === t && s.chipActive]} onPress={() => setTime(t)}>
                <Text style={[s.chipText, time === t && s.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={onDateConfirm}
            onCancel={onDateCancel}
            minimumDate={new Date()}
          />

          <DateTimePickerModal
            isVisible={showTimePicker}
            mode="time"
            onConfirm={onTimeConfirm}
            onCancel={onTimeCancel}
          />

          <ScaleButton onPress={handleCheckout}>
            <View style={s.checkoutBtn}>
              <Text style={s.checkoutBtnText}>Checkout • ${price}</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
            </View>
          </ScaleButton>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { backgroundColor: T.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.border, alignSelf: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: T.text1, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: T.text2, marginBottom: 12, marginTop: 16 },
  scrollRow: { flexDirection: 'row', gap: 12, paddingRight: 24 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: T.border, backgroundColor: T.bg },
  chipActive: { backgroundColor: T.accentLight, borderColor: T.accent },
  chipText: { fontSize: 14, fontWeight: '600', color: T.text2 },
  chipTextActive: { color: T.accent, fontWeight: '700' },
  
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.accent, borderRadius: 16, padding: 20, marginTop: 40 },
  checkoutBtnText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
