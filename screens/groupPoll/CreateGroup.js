import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  TouchableHighlight,
  TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import useLoadFonts from "src/hooks/useLoadFonts";
import { toastConfig, showToast } from "src/utils/toastconfig";
import { ThemeContext } from "src/components/ThemeContext";

SplashScreen.preventAutoHideAsync();

const CreateGroup = ({ navigation }) => {
  const [groupName, setGroupName] = useState("");
  const [type, setType] = useState("public");
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState("");
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const { theme } = useContext(ThemeContext);
  const { loaded, fonterror } = useLoadFonts();

  if (!loaded && !fonterror) return null;

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme === "dark" ? "#1A1A1A" : "#FFFFFF",
        height: 60,
        elevation: theme === "dark" ? 2 : 1,
        shadowOpacity: theme === "dark" ? 4 : 2,
      },
      headerTintColor: theme === "dark" ? "#60B8FF" : "#50A8EE",
      headerTitle: "Create Group",
      headerTitleStyle: {
        fontFamily: "Raleway-Bold",
        fontSize: 20,
        letterSpacing: 0.5,
        color: theme === "dark" ? "#FFFFFF" : "#50A8EE",
      },
      headerLeft: () => (
        <TouchableHighlight
          underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
          onPress={handleClose}
          className="px-2.5 rounded-full mt-1 ml-2"
        >
          <Icon
            name="arrow-left"
            size={20}
            color={theme === "dark" ? "#FFFFFF" : "#000000"}
          />
        </TouchableHighlight>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleCreateGroup}
          disabled={isLoading}
          style={{ marginRight: 10 }}
          className="bg-[#50A8EE] px-8 py-1.5 rounded-lg"
        >
          <Text
            className="text-[13px] tracking-wide text-white rounded-lg"
            style={{ fontFamily: "OpenSans-Regular" }}
          >
            Create
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleCreateGroup]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length < 4 ? prev + "." : ""));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const hasProgress = () => {
    return groupName.trim() !== "";
  };

  const handleClose = () => {
    if (hasProgress()) {
      setConfirmCloseVisible(true);
    } else {
      navigation.goBack();
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
      if (!currentGroupName || currentGroupName.length === 0) {
        showToast("error", "Group name is required and cannot be empty.");
        return;
      }

      console.log("Current State - groupName:", currentGroupName);
      console.log("User ID:", userId);
      console.log("Token:", token);

      const API_URL = "http://192.168.1.8:8000/api/makeGroup";

      const payload = {
        user_id: parseInt(userId, 10),
        groupName: currentGroupName,
        type,
      };

      console.log("Payload:", payload);

      setIsLoading(true);
      const response = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const { data } = response;
      setIsLoading(false);
      setSuccessModalVisible(true);
      setGroupName(""); // Reset form
      showToast("success", data.message);
    } catch (error) {
      setIsLoading(false);
      console.error("Error creating group:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.error || "Failed to create group.";
      showToast("error", errorMessage);
    }
  };

  return (
    <View
      className={`flex-1 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"}`}
    >
      <ScrollView
        className={`flex-1 px-2.5 mt-2.5 ${
          theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"
        }`}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          className={`border-b rounded-lg h-16 mb-4 text-[13px] tracking-wide ${
            theme === "dark"
              ? "border-[#444] text-white"
              : "border-[#ccc] text-black"
          }`}
          value={groupName}
          onChangeText={(text) => {
            console.log("Input:", text);
            setGroupName(text);
          }}
          placeholder="Group Name....."
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
        <View className="mb-10">
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
      </ScrollView>
      <Toast config={toastConfig} />

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
                    navigation.goBack();
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
        <TouchableWithoutFeedback
          onPress={() => setSuccessModalVisible(false)}
        >
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
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.navigate("GroupHome");
                }}
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
    </View>
  );
};

export default CreateGroup;