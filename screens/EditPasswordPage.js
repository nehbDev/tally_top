import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableHighlight, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ThemeContext } from "../src/components/ThemeContext";

const EditPasswordPage = ({ navigation, route }) => {
  const { user } = route.params || {};
  const { theme } = useContext(ThemeContext);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("auth_token");
      await axios.put(
        "http://192.168.1.21:8000/api/profile/password",
        { 
          current_password: currentPassword, 
          new_password: newPassword,
          confirm_new_password: confirmPassword  // Added this line
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Password updated successfully", [
        {
          text: "OK",
          onPress: () => navigation.navigate("ProfilePage"),
        },
      ]);
    } catch (err) {
      console.error("Error updating password:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className={`flex-1 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"} p-5`}
    >
      <View className="flex-row items-center mb-5">
        <TouchableHighlight
          onPress={() => navigation.goBack()}
          underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
          className="p-2 rounded-full"
        >
          <Icon
            name="arrow-left"
            size={24}
            color={theme === "dark" ? "white" : "black"}
          />
        </TouchableHighlight>
        <Text
          className={`text-[18px] ${theme === "dark" ? "text-white" : "text-black"} ml-3 tracking-wide`}
          style={{ fontFamily: "OpenSans-SemiBold" }}
        >
          Change Password
        </Text>
      </View>

      <View className="mt-5">
        <Text
          className={`text-[14px] ${theme === "dark" ? "text-[#AAA]" : "text-[#444]"} mb-2 tracking-wide`}
          style={{ fontFamily: "OpenSans-Regular" }}
        >
          Current Password
        </Text>
        <TextInput
          className={`p-3 rounded-xl ${theme === "dark" ? "bg-[#262626] text-white" : "bg-white text-black"} border ${theme === "dark" ? "border-[#444]" : "border-[#e5e5e5]"}`}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          placeholderTextColor={theme === "dark" ? "#666" : "#999"}
          style={{ fontFamily: "OpenSans-Regular" }}
          secureTextEntry
        />
      </View>

      <View className="mt-3">
        <Text
          className={`text-[14px] ${theme === "dark" ? "text-[#AAA]" : "text-[#444]"} mb-2 tracking-wide`}
          style={{ fontFamily: "OpenSans-Regular" }}
        >
          New Password
        </Text>
        <TextInput
          className={`p-3 rounded-xl ${theme === "dark" ? "bg-[#262626] text-white" : "bg-white text-black"} border ${theme === "dark" ? "border-[#444]" : "border-[#e5e5e5]"}`}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          placeholderTextColor={theme === "dark" ? "#666" : "#999"}
          style={{ fontFamily: "OpenSans-Regular" }}
          secureTextEntry
        />
      </View>

      <View className="mt-3">
        <Text
          className={`text-[14px] ${theme === "dark" ? "text-[#AAA]" : "text-[#444]"} mb-2 tracking-wide`}
          style={{ fontFamily: "OpenSans-Regular" }}
        >
          Confirm New Password
        </Text>
        <TextInput
          className={`p-3 rounded-xl ${theme === "dark" ? "bg-[#262626] text-white" : "bg-white text-black"} border ${theme === "dark" ? "border-[#444]" : "border-[#e5e5e5]"}`}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor={theme === "dark" ? "#666" : "#999"}
          style={{ fontFamily: "OpenSans-Regular" }}
          secureTextEntry
        />
      </View>

      {error && (
        <Text
          className="text-[12px] text-[#FF3B30] mt-3 tracking-wide"
          style={{ fontFamily: "OpenSans-Regular" }}
        >
          {error}
        </Text>
      )}

      <TouchableHighlight
        className={`mt-5 p-4 rounded-xl ${theme === "dark" ? "bg-[#50A8EE]" : "bg-[#50A8EE]"}`}
        underlayColor={theme === "dark" ? "#3B82F6" : "#2563EB"}
        onPress={handleUpdatePassword}
        disabled={loading}
      >
        <Text
          className="text-[14px] text-white text-center tracking-wide"
          style={{ fontFamily: "OpenSans-SemiBold" }}
        >
          {loading ? "Updating..." : "Update Password"}
        </Text>
      </TouchableHighlight>
    </View>
  );
};

export default EditPasswordPage;