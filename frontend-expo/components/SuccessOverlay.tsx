import React from "react";
import { View, StyleSheet, Modal, Text } from "react-native";
import { BookingSuccessSvg } from "@/components/svg";

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
  React.useEffect(() => {
    if (visible && onFinish) {
      const timer = setTimeout(onFinish, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.container}>
          <BookingSuccessSvg size={180} />
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
