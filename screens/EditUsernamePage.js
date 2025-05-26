import React, { useState, useContext } from "react";
import { View, Text, TextInput, TouchableHighlight, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { ThemeContext } from "../src/components/ThemeContext";

const EditUsernamePage = ({ navigation, route }) => {
  const { user } = route.params || {};
  const { theme } = useContext(ThemeContext);
  const [username, setUsername] = useState(user?.username || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem("auth_token");
      const response = await axios.put(
        "http://192.168.1.21:8000/api/profile/username", // Updated endpoint
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update AsyncStorage with new user data
      const updatedUser = { ...user, username: response.data.user.username }; // Adjusted to match API response
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

      Alert.alert("Success", "Username updated successfully", [
        {
          text: "OK",
          onPress: () => navigation.navigate("ProfilePage"),
        },
      ]);
    } catch (err) {
      console.error("Error updating username:", err.response ? err.response.data : err.message);
      setError(err.response?.data?.message || "Failed to update username");
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
          Edit Username
        </Text>
      </View>

      <View className="mt-5">
        <Text
          className={`text-[14px] ${theme === "dark" ? "text-[#AAA]" : "text-[#444]"} mb-2 tracking-wide`}
          style={{ fontFamily: "OpenSans-Regular" }}
        >
          New Username
        </Text>
        <TextInput
          className={`p-3 rounded-xl ${theme === "dark" ? "bg-[#262626] text-white" : "bg-white text-black"} border ${theme === "dark" ? "border-[#444]" : "border-[#e5e5e5]"}`}
          value={username}
          onChangeText={setUsername}
          placeholder="Enter new username"
          placeholderTextColor={theme === "dark" ? "#666" : "#999"}
          style={{ fontFamily: "OpenSans-Regular" }}
          autoCapitalize="none"
        />
        {error && (
          <Text
            className="text-[12px] text-[#FF3B30] mt-2 tracking-wide"
            style={{ fontFamily: "OpenSans-Regular" }}
          >
            {error}
          </Text>
        )}
      </View>

      <TouchableHighlight
        className={`mt-5 p-4 rounded-xl ${theme === "dark" ? "bg-[#50A8EE]" : "bg-[#50A8EE]"}`}
        underlayColor={theme === "dark" ? "#3B82F6" : "#2563EB"}
        onPress={handleUpdateUsername}
        disabled={loading}
      >
        <Text
          className="text-[14px] text-white text-center tracking-wide"
          style={{ fontFamily: "OpenSans-SemiBold" }}
        >
          {loading ? "Updating..." : "Update Username"}
        </Text>
      </TouchableHighlight>
    </View>
  );
};

export default EditUsernamePage;