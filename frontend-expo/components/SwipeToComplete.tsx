import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  onComplete: () => void;
  text?: string;
}

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width - 40; // Assuming 20px padding on each side
const THUMB_SIZE = 56;
const PADDING = 4;
const MAX_DRAG = SLIDER_WIDTH - THUMB_SIZE - PADDING * 2;

const T = {
  primary: "#0A192F",
  bg: "#F7F8FC",
  text: "#FFFFFF",
  success: "#00A699",
};

export default function SwipeToComplete({ onComplete, text = "Slide to Complete" }: Props) {
  const pan = useRef(new Animated.Value(0)).current;
  const [completed, setCompleted] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (completed) return;
        const newX = Math.max(0, Math.min(gestureState.dx, MAX_DRAG));
        pan.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (completed) return;
        
        // If dragged more than 85% of the way, snap to end and complete
        if (gestureState.dx > MAX_DRAG * 0.85) {
          setCompleted(true);
          Animated.timing(pan, {
            toValue: MAX_DRAG,
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            onComplete();
          });
        } else {
          // Otherwise snap back
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 12,
          }).start();
        }
      },
    })
  ).current;

  // Interpolate thumb color from dark navy to success green
  const backgroundColor = pan.interpolate({
    inputRange: [0, MAX_DRAG],
    outputRange: [T.primary, T.success],
    extrapolate: "clamp",
  });

  return (
    <View style={s.container}>
      <Text style={s.text}>{text}</Text>
      
      {/* Animated track fill */}
      <Animated.View style={[s.trackFill, { width: Animated.add(pan, THUMB_SIZE + PADDING * 2), backgroundColor }]} />

      <Animated.View
        style={[s.thumb, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <MaterialCommunityIcons name="chevron-double-right" size={32} color={T.primary} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: "100%",
    height: THUMB_SIZE + PADDING * 2,
    backgroundColor: T.bg,
    borderRadius: (THUMB_SIZE + PADDING * 2) / 2,
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: (THUMB_SIZE + PADDING * 2) / 2,
  },
  text: {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#94A3B8",
    zIndex: 1,
  },
  thumb: {
    position: "absolute",
    left: PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
