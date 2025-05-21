import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios"; // Install with: npm install axios

const EditProfile = ({ navigation }) => {
  const [user, setUser] = useState({
    username: "Guest User",
    email: "guest@example.com",
    avatar: "default-avatar.webp", // Match backend default
  });
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [modalVisible, setModalVisible] = useState(false);

  const avatarOptions = [
    "default-avatar.webp",
    "female-avatar.jpg",
    "male-avatar.png",
  ];

  const avatarMap = {
    "default-avatar.webp": require("../assets/images/default-avatar.webp"),
    "female-avatar.jpg": require("../assets/images/female-avatar.jpg"),
    "male-avatar.png": require("../assets/images/male-avatar.png"),
  };

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        console.log("Fetching profile with token:", token);
        if (!token) throw new Error("No auth token found");
  
        const response = await axios.get("http://192.168.190.150:8000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Profile response:", response.data);
        setUser(response.data);
        setSelectedAvatar(response.data.avatar);
        await AsyncStorage.setItem("user", JSON.stringify(response.data));
      } catch (error) {
        console.error("Error fetching profile:", error.response ? error.response.data : error.message);
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setSelectedAvatar(parsedUser.avatar);
        }
      }
    };
    fetchProfile();
  }, []);
  
  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      console.log("Sending request with token:", token);
      if (!token) throw new Error("No auth token found");
  
      const updatedUser = { ...user, avatar: selectedAvatar };
      const config = { headers: { Authorization: `Bearer ${token}` } };
      console.log("Request config:", config);
  
      const response = await axios.put(
        "http://192.168.190.150:8000/api/profile",
        { avatar: selectedAvatar },
        config
      );
      console.log("Server response:", response.data);
  
      // Ensure the full user object includes the avatar from the server response
      const savedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: selectedAvatar, // Explicitly set avatar
      };
      await AsyncStorage.setItem("user", JSON.stringify(savedUser));
      console.log("Saved user to AsyncStorage:", savedUser);
  
      setUser(savedUser);
      console.log("Profile updated in state:", savedUser);
    } catch (error) {
      console.error("Error saving profile:", error.response ? error.response.data : error.message);
    }
  };

  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    setModalVisible(false);
  };

  return (
    <View className="flex-1 px-4 mt-2 bg-[#F5F5F7]">
      <ScrollView className="flex-1">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-semibold text-[#555]">Edit Profile</Text>
          <TouchableOpacity
            className="p-2 bg-[#50A8EE] rounded-lg"
            onPress={handleSave}
          >
            <Text className="text-white font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white rounded-lg p-4 border border-[#ccc] mb-4">
          <View className="flex-row items-center">
            <View className="relative">
              <Image
                source={
                  avatarMap[selectedAvatar] ||
                  require("../assets/images/default-avatar.webp")
                }
                className="w-[60px] h-[60px] rounded-full mr-3"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-[#50A8EE] rounded-full p-1"
                onPress={() => setModalVisible(true)}
              >
                <Icon name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <View>
              <Text className="text-[16px] text-black tracking-wide">
                {user.username}
              </Text>
              <Text className="text-[14px] text-[#555] mt-1">{user.email}</Text>
            </View>
          </View>
        </View>

        <Modal
          transparent={true}
          animationType="fade"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]">
            <View className="bg-white p-5 rounded-xl w-4/5">
              <Text className="text-lg font-semibold text-[#555] mb-4 text-center">
                Select Avatar
              </Text>
              <ScrollView horizontal className="mb-4">
                {avatarOptions.map((avatar, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`w-[80px] h-[80px] rounded-full mx-2 ${
                      selectedAvatar === avatar ? "border-2 border-[#50A8EE]" : ""
                    }`}
                    onPress={() => handleAvatarSelect(avatar)}
                  >
                    <Image
                      source={avatarMap[avatar]}
                      className="w-full h-full rounded-full"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View className="flex-row justify-between">
                <Pressable
                  className="p-3 rounded-lg flex-1 items-center bg-[#F0F0F0] mr-2"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="text-[#333] font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  className="p-3 rounded-lg flex-1 items-center bg-[#50A8EE]"
                  onPress={() => setModalVisible(false)}
                >
                  <Text className="text-white font-semibold">Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

export default EditProfile;