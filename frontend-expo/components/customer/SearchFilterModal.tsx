import React from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

const T = Theme.colors;

interface SearchFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: { minPrice: string; maxPrice: string; rating: number | null; distance: string }) => void;
  resultCount?: number;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialRating?: number | null;
  initialDistance?: string;
}

export function SearchFilterModal({
  visible,
  onClose,
  onApply,
  resultCount = 0,
  initialMinPrice = "25",
  initialMaxPrice = "",
  initialRating = 4.5,
  initialDistance = "5",
}: SearchFilterModalProps) {
  const [minPrice, setMinPrice] = React.useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = React.useState(initialMaxPrice);
  const [selectedRating, setSelectedRating] = React.useState<number | null>(initialRating);
  const [selectedDistance, setSelectedDistance] = React.useState(initialDistance);

  // Sync initial state if it changes
  React.useEffect(() => {
    if (visible) {
      setMinPrice(initialMinPrice);
      setMaxPrice(initialMaxPrice);
      setSelectedRating(initialRating);
      setSelectedDistance(initialDistance);
    }
  }, [visible, initialMinPrice, initialMaxPrice, initialRating, initialDistance]);

  const handleApply = () => {
    onApply({
      minPrice,
      maxPrice,
      rating: selectedRating,
      distance: selectedDistance,
    });
  };

  const handleReset = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedRating(null);
    setSelectedDistance("25");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHandle} />
          
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={T.text1} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={s.modalReset}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Price */}
            <View style={s.filterSection}>
              <Text style={s.filterTitle}>Price Range</Text>
              <View style={s.filterRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.filterLabel}>MIN PRICE</Text>
                  <View style={s.filterInputBox}>
                    <Text style={s.filterInputPrefix}>$</Text>
                    <TextInput value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" style={s.filterInput} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.filterLabel}>MAX PRICE</Text>
                  <View style={s.filterInputBox}>
                    <Text style={s.filterInputPrefix}>$</Text>
                    <TextInput value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" style={s.filterInput} />
                  </View>
                </View>
              </View>
            </View>

            {/* Rating */}
            <View style={s.filterSection}>
              <Text style={s.filterTitle}>Rating</Text>
              <View style={s.filterRow}>
                {[4.5, 4.0, 3.5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setSelectedRating(rating === selectedRating ? null : rating)}
                    style={[s.ratingBtn, selectedRating === rating && s.ratingBtnActive]}
                  >
                    <MaterialIcons name="star" size={16} color={selectedRating === rating ? T.accent : T.text3} />
                    <Text style={[s.ratingBtnText, selectedRating === rating && s.ratingBtnTextActive]}>
                      {rating}+
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance */}
            <View style={s.filterSection}>
              <Text style={s.filterTitle}>Distance</Text>
              <View style={s.distanceWrap}>
                {["5", "10", "25"].map((dist) => (
                  <TouchableOpacity
                    key={dist}
                    onPress={() => setSelectedDistance(dist)}
                    style={[s.distBtn, selectedDistance === dist && s.distBtnActive]}
                  >
                    <Text style={[s.distBtnText, selectedDistance === dist && s.distBtnTextActive]}>
                      {dist === "5" ? "Within 5" : `${dist} miles`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={s.modalFooter}>
            <TouchableOpacity onPress={onClose} style={s.modalBtnSecondary}>
              <Text style={s.modalBtnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleApply} style={s.modalBtnPrimary}>
              <Text style={s.modalBtnPrimaryText}>
                {resultCount > 0 ? `Show ${resultCount} Results` : "Apply Filters"}
              </Text>
              <MaterialIcons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: T.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, height: "85%" },
  modalHandle: { width: 40, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: "center", marginBottom: 24 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: T.text1 },
  modalReset: { fontSize: 15, fontWeight: "700", color: T.text3 },
  
  filterSection: { paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: T.border },
  filterTitle: { fontSize: 16, fontWeight: "800", color: T.text1, marginBottom: 16 },
  filterRow: { flexDirection: "row", gap: 12 },
  filterLabel: { fontSize: 11, fontWeight: "800", color: T.text3, marginBottom: 8, letterSpacing: 0.5 },
  filterInputBox: { flexDirection: "row", alignItems: "center", backgroundColor: T.bg, borderRadius: 12, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: T.border },
  filterInputPrefix: { fontSize: 15, fontWeight: "700", color: T.text3, marginRight: 8 },
  filterInput: { flex: 1, fontSize: 15, fontWeight: "700", color: T.text1 },
  
  ratingBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: T.bg, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 4, borderWidth: 1, borderColor: T.border },
  ratingBtnActive: { backgroundColor: T.accentLight, borderColor: T.accent },
  ratingBtnText: { fontSize: 14, fontWeight: "700", color: T.text2 },
  ratingBtnTextActive: { color: T.accent },

  distanceWrap: { flexDirection: "row", backgroundColor: T.bg, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: T.border },
  distBtn: { flex: 1, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  distBtnActive: { backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  distBtnText: { fontSize: 13, fontWeight: "700", color: T.text3 },
  distBtnTextActive: { color: T.text1 },

  modalFooter: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, backgroundColor: T.surface, borderTopWidth: 1, borderTopColor: T.border, flexDirection: "row", gap: 12 },
  modalBtnSecondary: { flex: 1, height: 56, borderRadius: 16, borderWidth: 2, borderColor: T.text1, alignItems: "center", justifyContent: "center" },
  modalBtnSecondaryText: { fontSize: 16, fontWeight: "800", color: T.text1 },
  modalBtnPrimary: { flex: 1.5, height: 56, borderRadius: 16, backgroundColor: T.text1, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  modalBtnPrimaryText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
