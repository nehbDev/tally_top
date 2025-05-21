import { View, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Generic Toast Component with Dynamic Background Color
const CustomToast = ({ text1, icon, color, bgColor }) => (
  <View style={[styles.toastContainer, { borderLeftColor: color, backgroundColor: bgColor }]}>
    <Icon name={icon} size={20} color="#fff" style={styles.toastIcon} />
    <Text style={styles.toastText} className="tracking-wide">{text1}</Text>
  </View>
);

// Toast Configuration
const toastConfig = {
  success: (props) => <CustomToast {...props} icon="check-circle-outline" color="#4CAF50" bgColor="#4CAF50" />,
  error: (props) => <CustomToast {...props} icon="alert-circle-outline" color="#FF4D4D" bgColor="#FF4D4D" />,
  
};


// Show Toast Function
const showToast = (type, message) => {
  Toast.show({
    type,
    text1: message,
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 10,
  });
};

// Styles
const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "95%",
    padding: 15,
    borderRadius: 10,
    alignSelf: "center",
  },
  toastIcon: {
    marginRight: 10,
    color: "#fff",
  },
  toastText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "left",
    fontFamily: "OpenSans-Regular",
  },
});

export { toastConfig, showToast };
