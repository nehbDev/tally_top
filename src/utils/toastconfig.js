import { View, Text, StyleSheet, Platform } from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Generic Toast Component with Dynamic Background Color
const CustomToast = ({ text1, icon, color, bgColor }) => {
  const insets = useSafeAreaInsets() || { top: 20 }; // Fallback to 20 if insets are unavailable

  return (
    <View
      style={[
        styles.toastContainer,
        {
          borderLeftColor: color,
          backgroundColor: bgColor,
          marginTop: insets.top, // Position just below the safe area (status bar/notch)
        },
      ]}
    >
      <Icon name={icon} size={20} color="#fff" style={styles.toastIcon} />
      <Text style={styles.toastText} className="tracking-wide">
        {text1}
      </Text>
    </View>
  );
};

// Toast Configuration
const toastConfig = {
  success: (props) => (
    <CustomToast {...props} icon="check-circle-outline" color="#4CAF50" bgColor="#4CAF50" />
  ),
  error: (props) => (
    <CustomToast {...props} icon="alert-circle-outline" color="#FF4D4D" bgColor="#FF4D4D" />
  ),
};

// Show Toast Function
const showToast = (type, message) => {
  Toast.show({
    type,
    text1: message,
    visibilityTime: 3000,
    autoHide: true,
    position: "top",
    topOffset: 0, // Rely on CustomToast's marginTop for positioning
  });
};

// Styles
const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    padding: 15,
    borderRadius: 10,
    alignSelf: "center",
    zIndex: 1000, // Ensure toast is above header and other elements
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toastIcon: {
    marginRight: 10,
    color: "#fff",
  },
  toastText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "left",
    fontFamily: "OpenSans-Regular",
  },
});

export { toastConfig, showToast };