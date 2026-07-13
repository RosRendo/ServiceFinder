import React from "react";
import { View, StyleSheet, Modal, Text } from "react-native";
import LottieView from "lottie-react-native";

interface Props {
  visible: boolean;
  onFinish?: () => void;
  message?: string;
}

const T = {
  bg: "#FFFFFF",
  text: "#0A192F",
};

export default function SuccessOverlay({ visible, onFinish, message = "Success!" }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.container}>
          <LottieView
            source={require("@/assets/animations/success.json")}
            autoPlay
            loop={false}
            style={{ width: 180, height: 180 }}
            onAnimationFinish={onFinish}
            speed={1.5}
          />
          <Text style={s.text}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    alignItems: "center",
  },
  text: {
    marginTop: -20,
    fontSize: 22,
    fontWeight: "800",
    color: T.text,
    letterSpacing: -0.5,
  },
});
