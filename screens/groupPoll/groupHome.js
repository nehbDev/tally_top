import React, { useState, useContext, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import Toast from "react-native-toast-message";

import useLoadFonts from "src/hooks/useLoadFonts";
import { ThemeContext } from "src/components/ThemeContext";
import { toastConfig, showToast } from "src/utils/toastconfig";

SplashScreen.preventAutoHideAsync();

const GroupHome = ({ navigation, route }) => {
  const [groupCode, setGroupCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(route.params?.activeTab || "public");
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [type, setType] = useState("public");
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState("");
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [groups, setGroups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { theme } = useContext(ThemeContext);
  const { loaded, fonterror } = useLoadFonts();

  if (!loaded && !fonterror) return null;

  // Fetch current user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("user_id");
        const parsedUserId = userId ? parseInt(userId, 10) : null;
        setCurrentUserId(parsedUserId);
        console.log("Current User ID:", parsedUserId);
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [activeTab]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length < 4 ? prev + "." : ""));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const fetchGroups = async () => {
    try {
      setRefreshing(true);
      const API_URL = "http://192.168.1.8:8000/api/get-group-polls";
      const response = await axios.get(API_URL, {
        params: { type: activeTab },
        timeout: 10000,
      });
      if (response.data.success) {
        const fetchedGroups = response.data.groups || [];
        setGroups(fetchedGroups);
      } else {
        console.error("API Error:", response.data.message);
        showToast("error", response.data.message || "Failed to fetch groups");
      }
    } catch (error) {
      console.error("Fetch Groups Error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      showToast("error", error.response?.data?.message || "Failed to connect to server");
    } finally {
      setRefreshing(false);
    }
  };

  const handleJoinGroup = async () => {
    setLoading(true);
    try {
      const API_URL = "http://192.168.1.8:8000/api/join-group-poll";
      const response = await axios.post(API_URL, { groupCode });
      if (response.data.success) {
        navigation.navigate("PollDisplay", { polls: response.data.polls });
        console.log("Group polls found successfully!");
      } else {
        showToast("error", response.data.message || "Invalid group code");
      }
    } catch (error) {
      console.error("Join Group Error:", error.message);
      showToast("error", error.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      const token = await AsyncStorage.getItem("auth_token");

      if (!userId) {
        showToast("error", "User ID not found. Please log in.");
        return;
      }

      const currentGroupName = groupName.trim();
      if (!currentGroupName) {
        showToast("error", "Group name is required and cannot be empty.");
        return;
      }

      const API_URL = "http://192.168.1.8:8000/api/makeGroup";
      const payload = {
        user_id: parseInt(userId, 10),
        groupName: currentGroupName,
        type,
      };

      setIsLoading(true);
      const response = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setIsLoading(false);
      setSuccessModalVisible(true);
      setGroupName("");
      setType("public");
      setCreateModalVisible(false);
      showToast("success", response.data.message);
      fetchGroups();
    } catch (error) {
      setIsLoading(false);
      console.error("Create Group Error:", error.response?.data || error);
      showToast("error", error.response?.data?.error || "Failed to create group");
    }
  };

  const handleGroupPress = (group) => {
    navigation.navigate("GroupPollDisplay", { groupId: group.id });
  };

  const clearGroupCode = () => setGroupCode("");

  const hasProgress = () => groupName.trim() !== "";

  const handleCloseCreateModal = () => {
    if (hasProgress()) {
      setConfirmCloseVisible(true);
    } else {
      setCreateModalVisible(false);
      setGroupName("");
      setType("public");
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const groupName = group.groupName || "";
      return groupName.toLowerCase().includes(lowerCaseQuery);
    });
  }, [groups, searchQuery]);

  const refreshControlTintColor = theme === "dark" ? "#60B8FF" : "#50A8EE";
  const refreshControlColors = theme === "dark" ? ["#60B8FF"] : ["#50A8EE"];
  const progressBackgroundColor = theme === "dark" ? "#2A2A2A" : "#F5F5F7";

  return (
    <View
      className={`flex-1 px-1 h-full ${
        theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"
      }`}
    >
      <View className="flex-row justify-between px-2.5 py-2.5">
        <TouchableOpacity
          onPress={() => setActiveTab("public")}
          className={`flex-1 py-2 rounded-l-lg ${
            activeTab === "public"
              ? theme === "dark"
                ? "bg-[#60B8FF]"
                : "bg-[#50A8EE]"
              : theme === "dark"
              ? "bg-[#2A2A2A]"
              : "bg-[#E0E0E0]"
          }`}
        >
          <Text
            className={`text-center text-[14px] font-semibold ${
              activeTab === "public"
                ? "text-white"
                : theme === "dark"
                ? "text-white"
                : "text-black"
            }`}
            style={{ fontFamily: "OpenSans-SemiBold" }}
          >
            Public
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("private")}
          className={`flex-1 py-2 rounded-r-lg ${
            activeTab === "private"
              ? theme === "dark"
                ? "bg-[#60B8FF]"
                : "bg-[#50A8EE]"
              : theme === "dark"
              ? "bg-[#2A2A2A]"
              : "bg-[#E0E0E0]"
          }`}
        >
          <Text
            className={`text-center text-[14px] font-semibold ${
              activeTab === "private"
                ? "text-white"
                : theme === "dark"
                ? "text-white"
                : "text-black"
            }`}
            style={{ fontFamily: "OpenSans-SemiBold" }}
          >
            Private
          </Text>
        </TouchableOpacity>
      </View>

      <View
        className={`px-2.5 py-2.5 ${
          theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"
        }`}
      >
        <View className="flex-row items-center border border-[#dee2e6] rounded-sm">
          <TextInput
            className={`flex-1 h-[40px] px-3 text-[12px] tracking-wide ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
            placeholder="Enter group code or search..."
            value={groupCode}
            onChangeText={setGroupCode}
            placeholderTextColor={theme === "dark" ? "white" : "#444"}
            style={{ fontFamily: "OpenSans-Medium" }}
          />
          <TouchableOpacity className="p-1.5" onPress={clearGroupCode}>
            <Icon name="close" size={20} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="w-full px-2.5 mt-2.5"
        contentContainerStyle={{ paddingBottom: 70 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchGroups}
            tintColor={refreshControlTintColor}
            colors={refreshControlColors}
            progressBackgroundColor={progressBackgroundColor}
          />
        }
      >
        {filteredGroups.length > 0 ? (
          filteredGroups.map((group, index) => (
            <TouchableOpacity
              key={group.id || index}
              className={`p-4 mb-2.5 rounded-lg shadow-xl elevation-7 ${
                theme === "dark" ? "bg-[#262626]" : "bg-white shadow-black/50"
              }`}
              onPress={() => handleGroupPress(group)}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-start">
                  <Image
                    source={require("../../assets/images/default-avatar.webp")}
                    className="w-[35px] h-[35px] rounded-full mr-2"
                    onError={(e) =>
                      console.log("Image load error:", e.nativeEvent.error)
                    }
                  />
                  <View className="flex-col">
                    <Text
                      className={`text-[12px] tracking-wide ${
                        theme === "dark" ? "text-white" : "text-black"
                      }`}
                      style={{ fontFamily: "OpenSans-SemiBold" }}
                    >
                      {currentUserId && group.user?.id === currentUserId
                        ? "By Me"
                        : group.user?.username || "Unknown"}
                    </Text>
                    <Text
                      className={`text-[11px] tracking-normal ${
                        theme === "dark" ? "text-[#ccc]" : "text-[#555]"
                      }`}
                      style={{ fontFamily: "OpenSans-Medium" }}
                    >
                      Created {moment(group.created_at).fromNow()}
                    </Text>
                  </View>
                </View>
              </View>
              <Text
                className={`text-[20px] tracking-wide ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
                numberOfLines={2}
                ellipsizeMode="head"
              >
                {group.groupName}
              </Text>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2.5">
                  <Text
                    className="text-[11px] text-[#50A8EE] tracking-wide"
                    style={{ fontFamily: "OpenSans-SemiBold" }}
                  >
                    {group.totalPolls}{" "}
                    {group.totalPolls === 1 ? "poll" : "polls"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text
            className="text-center mt-12 text-lg text-[#555]"
            style={{ fontFamily: "Inter-Medium" }}
          >
            No groups available.
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity
        className={`absolute bottom-5 right-5 w-14 h-14 rounded-full ${
          theme === "dark" ? "bg-[#60B8FF]" : "bg-[#50A8EE]"
        } items-center justify-center shadow-lg`}
        onPress={() => setCreateModalVisible(true)}
      >
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={createModalVisible}
        animationType="slide"
        onRequestClose={handleCloseCreateModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseCreateModal}>
          <View className="flex-1 bg-black/50 justify-end">
            <View
              className={`rounded-t-3xl p-5 ${
                theme === "dark" ? "bg-[#262626]" : "bg-white"
              }`}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  className={`text-[20px] tracking-wide ${
                    theme === "dark" ? "text-white" : "text-[#50A8EE]"
                  }`}
                  style={{ fontFamily: "Raleway-Bold" }}
                >
                  Create Group
                </Text>
                <TouchableOpacity onPress={handleCloseCreateModal}>
                  <Icon
                    name="close"
                    size={24}
                    color={theme === "dark" ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>
              <TextInput
                className={`border-b rounded-lg h-12 mb-4 text-[13px] tracking-wide ${
                  theme === "dark"
                    ? "border-[#444] text-white"
                    : "border-[#ccc] text-black"
                }`}
                value={groupName}
                onChangeText={(text) => setGroupName(text)}
                placeholder="Group Name..."
                style={{ fontFamily: "OpenSans-Medium" }}
                placeholderTextColor={theme === "dark" ? "white" : "black"}
              />
              <Text
                className={`text-[13px] mb-3 tracking-wide ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-Bold" }}
              >
                Visibility
              </Text>
              <View className="mb-6">
                <TouchableOpacity
                  className="flex-row items-center mb-5"
                  onPress={() => setType("public")}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-2.5 ${
                      type === "public"
                        ? "border-[#50A8EE] bg-[#50A8EE]"
                        : "border-[#ccc]"
                    }`}
                  >
                    {type === "public" && (
                      <View className="w-2 h-2 rounded-full bg-white self-center mt-1" />
                    )}
                  </View>
                  <View>
                    <Text
                      className={`text-[13px] tracking-wide ${
                        theme === "dark" ? "text-white" : "text-black"
                      }`}
                      style={{ fontFamily: "OpenSans-Semibold" }}
                    >
                      Public Group
                    </Text>
                    <Text
                      className={`text-[12px] tracking-wide ${
                        theme === "dark" ? "text-[#fff]" : "text-black"
                      }`}
                      style={{ fontFamily: "OpenSans-Medium" }}
                    >
                      Anyone can join
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => setType("private")}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-2.5 ${
                      type === "private"
                        ? "border-[#50A8EE] bg-[#50A8EE]"
                        : "border-[#ccc]"
                    }`}
                  >
                    {type === "private" && (
                      <View className="w-2 h-2 rounded-full bg-white self-center mt-1" />
                    )}
                  </View>
                  <View>
                    <Text
                      className={`text-[13px] tracking-wide ${
                        theme === "dark" ? "text-white" : "text-black"
                      }`}
                      style={{ fontFamily: "OpenSans-Semibold" }}
                    >
                      Private Group
                    </Text>
                    <Text
                      className={`text-[12px] tracking-wide w-2/3 ${
                        theme === "dark" ? "text-[#fff]" : "text-black"
                      }`}
                      style={{ fontFamily: "OpenSans-Medium" }}
                    >
                      Only with group code can join
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className={`bg-[#50A8EE] rounded-xl p-3 items-center ${
                  isLoading ? "opacity-50" : "opacity-100"
                }`}
                onPress={handleCreateGroup}
                disabled={isLoading}
              >
                <Text
                  className="text-white text-[14px] tracking-wider"
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {isLoading && (
        <Modal transparent={true} animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="w-3/5 items-center">
              <ActivityIndicator size="large" color="#50A8EE" />
              <View className="flex-row items-center justify-center gap-1">
                <Text
                  className="text-white text-[15px] tracking-wide"
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  Creating group
                </Text>
                <Text className="text-[#50A8EE] text-[18px] tracking-wide">
                  {dots}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        transparent={true}
        visible={confirmCloseVisible}
        animationType="none"
        onRequestClose={() => setConfirmCloseVisible(false)}
      >
        <View className="flex-1 bg-black/50">
          <TouchableOpacity
            className="flex-1 w-full justify-end items-center"
            activeOpacity={1}
            onPress={() => setConfirmCloseVisible(false)}
          >
            <View
              className={`w-full p-6 rounded-t-3xl ${
                theme === "dark" ? "bg-[#262626]" : "bg-white"
              }`}
            >
              <Text
                className={`text-[14px] tracking-wide mb-3 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Do you want to stop creating your group?
              </Text>
              <Text
                className={`text-[14px] tracking-wide mb-10 ${
                  theme === "dark" ? "text-[#ccc]" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-Regular" }}
              >
                If you stop now, you’ll lose any progress you made.
              </Text>
              <View className="flex-row gap-2 justify-between">
                <TouchableOpacity
                  onPress={() => {
                    setConfirmCloseVisible(false);
                    setCreateModalVisible(false);
                    setGroupName("");
                    setType("public");
                  }}
                  className="flex-1 border border-[#FF5555] p-2 rounded-lg"
                >
                  <Text
                    className={`text-[13px] tracking-wide text-center ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                    style={{ fontFamily: "OpenSans-Regular" }}
                  >
                    Stop
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setConfirmCloseVisible(false)}
                  className="flex-1 bg-[#50A8EE] p-2 rounded-lg"
                >
                  <Text
                    className="text-white text-[13px] tracking-wide text-center"
                    style={{ fontFamily: "OpenSans-Regular" }}
                  >
                    Continue
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={successModalVisible}
        animationType="none"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSuccessModalVisible(false)}>
          <View
            className={`flex-1 justify-end ${
              theme === "dark" ? "bg-black/50" : "bg-black/50"
            }`}
          >
            <View
              className={`rounded-t-3xl p-5 ${
                theme === "dark" ? "bg-[#262626]" : "bg-white"
              }`}
            >
              <View className="flex-row items-center justify-center gap-2.5 mt-2.5 mb-5">
                <Icon name="check-circle" size={20} color="green" />
                <Text
                  className={`text-[14px] tracking-wide ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                  style={{ fontFamily: "OpenSans-SemiBold" }}
                >
                  Your Group Has Been Created
                </Text>
              </View>
              <TouchableOpacity
                className="mt-4 bg-[#50A8EE] rounded-xl p-3 items-center"
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text
                  className="text-white text-[14px] tracking-wider"
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  Back To Groups
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="mt-2 p-2"
                onPress={() => setSuccessModalVisible(false)}
              >
                <Text
                  className={`text-[14px] tracking-wide text-center ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Toast config={toastConfig} />
    </View>
  );
};

export default GroupHome;
