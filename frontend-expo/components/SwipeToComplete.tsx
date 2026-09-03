import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder, LayoutChangeEvent, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  onComplete: () => void;
  text?: string;
  trackColor?: string;
  activeTrackColor?: string;
  textColor?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  thumbColor?: string;
  iconColor?: string;
}

const THUMB_SIZE = 48;
const PADDING = 4;

export default function SwipeToComplete({
  onComplete,
  text = "Slide to Confirm",
  trackColor = "#F1F5F9",
  activeTrackColor = "#10B981",
  textColor = "#64748B",
  icon = "chevron-double-right",
  thumbColor = "#FFFFFF",
  iconColor = "#10B981",
}: Props) {
  const containerWidthRef = useRef(320);
  const [, setWidthState] = useState(320);
  const pan = useRef(new Animated.Value(0)).current;
  const [completed, setCompleted] = useState(false);

  const getMaxDrag = () => {
    return Math.max(1, containerWidthRef.current - THUMB_SIZE - PADDING * 2);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderTerminationRequest: () => false, // Prevent parent ScrollView from stealing touch
      onPanResponderGrant: () => {
        // Drag started
      },
      onPanResponderMove: (_, gestureState) => {
        if (completed) return;
        const maxDrag = getMaxDrag();
        const newX = Math.max(0, Math.min(gestureState.dx, maxDrag));
        pan.setValue(newX);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (completed) return;
        const maxDrag = getMaxDrag();

        // If dragged more than 60% of the bar, complete the action
        if (gestureState.dx > maxDrag * 0.6) {
          setCompleted(true);
          Animated.timing(pan, {
            toValue: maxDrag,
            duration: 120,
            useNativeDriver: false,
          }).start(() => {
            onComplete();
            setTimeout(() => {
              setCompleted(false);
              pan.setValue(0);
            }, 1200);
          });
        } else {
          // Snap back smoothly
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        if (!completed) {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      containerWidthRef.current = w;
      setWidthState(w);
    }
  };

  return (
    <View 
      style={[s.container, { backgroundColor: trackColor }]} 
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <Text style={[s.text, { color: textColor }]} pointerEvents="none">
        {completed ? "Confirmed! ✓" : text}
      </Text>

      {/* Animated track fill */}
      <Animated.View
        style={[
          s.trackFill,
          {
            width: Animated.add(pan, THUMB_SIZE + PADDING * 2),
            backgroundColor: activeTrackColor,
          },
        ]}
        pointerEvents="none"
      />

      {/* The Draggable Thumb */}
      <Animated.View
        style={[
          s.thumb,
          {
            backgroundColor: thumbColor,
            transform: [{ translateX: pan }],
          },
        ]}
      >
        <MaterialCommunityIcons
          name={completed ? "check-bold" : icon}
          size={24}
          color={completed ? "#10B981" : iconColor}
        />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: "100%",
    height: THUMB_SIZE + PADDING * 2,
    borderRadius: (THUMB_SIZE + PADDING * 2) / 2,
    justifyContent: "center",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
    zIndex: 1,
    paddingLeft: THUMB_SIZE / 2,
  },
  thumb: {
    position: "absolute",
    left: PADDING,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
});
