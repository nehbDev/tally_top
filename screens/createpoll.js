import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  FlatList,
  TouchableHighlight,
  SafeAreaView,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import useLoadFonts from '../src/hooks/useLoadFonts';
import { toastConfig, showToast } from '../src/utils/toastconfig';
import { ThemeContext } from '../src/components/ThemeContext';
import { getApiUrl } from "../apiConfig";

SplashScreen.preventAutoHideAsync();

const CreatePollPage = ({
  navigation,
  onClose,
  addPollOptimistically,
  fetchUserAndPolls,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [pollType, setPollType] = useState("public");
  const [duration, setDuration] = useState(""); // Initialize as empty string
  const [durationUnit, setDurationUnit] = useState("minutes");
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const { theme } = useContext(ThemeContext);
  const { loaded, fonterror } = useLoadFonts();
  const insets = useSafeAreaInsets();

  if (!loaded && !fonterror) return null;

  const durationUnits = [
    { label: "Minutes", value: "minutes" },
    { label: "Hours", value: "hours" },
    { label: "Days", value: "days" },
  ];

  const getDurationInMinutes = (inputDuration) => {
    if (!inputDuration || isNaN(inputDuration)) return null; // Return null if no duration
    let durationInMinutes;
    switch (durationUnit) {
      case "minutes":
        durationInMinutes = inputDuration;
        break;
      case "hours":
        durationInMinutes = inputDuration * 60;
        break;
      case "days":
        durationInMinutes = inputDuration * 24 * 60;
        break;
      default:
        durationInMinutes = inputDuration;
    }
    console.log("Duration in Minutes:", durationInMinutes);
    return durationInMinutes;
  };

  const hasProgress = () => {
    return (
      title.trim() !== "" ||
      description.trim() !== "" ||
      options.some((opt) => opt.trim() !== "") ||
      duration !== ""
    );
  };

  const handleClose = () => {
    if (hasProgress()) {
      setConfirmCloseVisible(true);
    } else {
      navigation.goBack();
    }
  };

  const handleCreatePoll = async () => {
    const [userId, token] = await Promise.all([
      AsyncStorage.getItem("user_id"),
      AsyncStorage.getItem("auth_token"),
    ]);

    if (!userId || !token) {
      showToast("error", "Please log in again.");
      return;
    }

    const durationInMinutes = getDurationInMinutes(parseInt(duration, 10));

    const API_URL = getApiUrl("polls");

    const payload = {
      user_id: parseInt(userId, 10),
      title: title.trim(),
      description: description?.trim() || "",
      type: pollType,
      choices: options.map((opt) => opt.trim()),
    };

    // Only include duration if it’s valid
    if (durationInMinutes !== null) {
      payload.duration = durationInMinutes;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setIsLoading(false);

      showToast("success", response.data.message || "Poll created successfully!");
      resetForm();
      setSuccessModalVisible(true);
      setTimeout(() => {
        setSuccessModalVisible(false);
        navigation.navigate("HomeScreen");
      }, 2000);
    } catch (error) {
      setIsLoading(false);
      console.error("Error creating poll:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Something went wrong while creating the poll.";
      showToast("error", errorMessage);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOptions(["", ""]);
    setDuration("");
    setDurationUnit("minutes");
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: () => (
        <View
          className={`flex-row items-center px-2.5 justify-between py-2 ${
            theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"
          }`}
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 12,
          }}
        >
          <View className="flex-row items-center">
            <TouchableHighlight
              onPress={handleClose}
              className="mr-3 mt-1 rounded-full"
              underlayColor={theme === "dark" ? "#555555" : "#F5F5F7"}
            >
              <Icon
                name="arrow-left"
                size={20}
                color={theme === "dark" ? "#FFFFFF" : "#000000"}
              />
            </TouchableHighlight>
            <Text
              className={`text-[18px] tracking-wider ${
                theme === "dark" ? "text-white" : "text-[#50A8EE]"
              }`}
              style={{ fontFamily: "Raleway-Bold" }}
            >
              Create Poll
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCreatePoll}
            disabled={isLoading}
            className="bg-[#50A8EE] px-8 py-1.5 rounded-lg"
          >
            <Text
              className="text-[13px] tracking-wide text-white"
              style={{ fontFamily: "OpenSans-Regular" }}
            >
              Post
            </Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, handleCreatePoll, theme, insets]);

  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length < 4 ? prev + "." : ""));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const renderPickerItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setDurationUnit(item.value);
        setPickerVisible(false);
        console.log("Duration Unit:", item.value);
      }}
      className={`py-3 px-4 border-b ${
        theme === "dark" ? "border-[#444] bg-[#1A1A1A]" : "border-[#ccc] bg-[#F5F5F7]"
      }`}
    >
      <Text
        className={theme === "dark" ? "text-white" : "text-[#444]"}
        style={{
          fontFamily: "Raleway-Regular",
          fontSize: 13,
          letterSpacing: 0.5,
        }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      className={`flex-1 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"}`}
    >
      <View
        className={`flex-1 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"}`}
      >
        <ScrollView
          className={`flex-1 px-2.5 ${
            theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"
          }`}
          contentContainerStyle={{
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            className={`border-b rounded-lg h-16 mb-4 text-[13px] tracking-wide ${
              theme === "dark"
                ? "border-[#444] text-white"
                : "border-[#ccc] text-black"
            }`}
            value={title}
            onChangeText={setTitle}
            placeholder="Title goes here....."
            style={{ fontFamily: "OpenSans-Medium" }}
            placeholderTextColor={theme === "dark" ? "white" : "black"}
          />

          <TextInput
            className={`border-b rounded-lg h-20 mb-10 text-[13px] tracking-wide ${
              theme === "dark"
                ? "border-[#444] text-white"
                : "border-[#ccc] text-black"
            }`}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Description goes here (Optional)....."
            textAlignVertical="top"
            placeholderTextColor={theme === "dark" ? "white" : "black"}
            style={{ fontFamily: "OpenSans-Medium" }}
          />

          <Text
            className={`text-[13px] mb-3 tracking-wide ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
            style={{ fontFamily: "OpenSans-Bold" }}
          >
            Poll Options
          </Text>
          {options.map((option, index) => (
            <View
              key={index}
              className={`flex-row items-center mb-2 w-full border rounded-xl h-16 px-2.5 ${
                theme === "dark" ? "border-[#fff]" : "border-[#ccc]"
              }`}
            >
              <TextInput
                className={`flex-1 h-full text-[12px] tracking-wide ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                value={option}
                onChangeText={(text) => {
                  const newOptions = [...options];
                  newOptions[index] = text;
                  setOptions(newOptions);
                }}
                placeholder={`Option ${index + 1}`}
                style={{ fontFamily: "OpenSans-Medium" }}
                placeholderTextColor={theme === "dark" ? "#fff" : "#000"}
              />
              {index >= 2 && (
                <TouchableOpacity
                  onPress={() => {
                    const newOptions = [...options];
                    newOptions.splice(index, 1);
                    setOptions(newOptions);
                  }}
                  className="ml-2.5"
                >
                  <Icon
                    name="close-circle"
                    size={20}
                    color={theme === "dark" ? "#FF5555" : "red"}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            className="flex-row items-left mb-5 mt-2 justify-end"
            onPress={() => {
              if (options.length < 6) {
                setOptions([...options, ""]);
              }
            }}
          >
            <Icon
              name="plus"
              size={19}
              color={theme === "dark" ? "#60B8FF" : "#50A8EE"}
            />
            <Text
              className="text-[12px] text-[#50A8EE] tracking-wide"
              style={{ fontFamily: "OpenSans-Medium" }}
            >
              Add Option
            </Text>
          </TouchableOpacity>

          <Text
            className={`text-[13px] mb-3 tracking-wide ${
              theme === "dark" ? "text-white" : "text-black"
            }`}
            style={{ fontFamily: "OpenSans-Bold" }}
          >
            Set Duration (Optional)
          </Text>
          <View
            className={`flex-row items-center mb-8 w-full border-b rounded-md h-12 px-2.5 ${
              theme === "dark" ? "border-[#444]" : "border-[#ccc]"
            }`}
          >
            <TextInput
              className={`flex-1 h-full text-[12px] tracking-wide ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
              value={duration}
              onChangeText={(text) => {
                const newDuration = text === "" ? "" : parseInt(text, 10) || "";
                setDuration(newDuration.toString());
                console.log("Duration Input:", newDuration);
              }}
              keyboardType="numeric"
              placeholder="Enter duration (optional)"
              placeholderTextColor={theme === "dark" ? "#fff" : "#000"}
              style={{ fontFamily: "OpenSans-Medium" }}
            />
            <TouchableOpacity
              onPress={() => setPickerVisible(true)}
              className={`flex-row items-center justify-between gap-5 h-full px-2 ${
                theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"
              }`}
            >
              <Text
                className={`text-[12px] tracking-wide ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-Medium" }}
              >
                {durationUnits.find((unit) => unit.value === durationUnit)?.label ||
                  "Select"}
              </Text>
              <Icon
                name="chevron-down"
                size={20}
                color={theme === "dark" ? "#fff" : "#444"}
              />
            </TouchableOpacity>
          </View>

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
              onPress={() => setPollType("public")}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-2.5 ${
                  pollType === "public"
                    ? "border-[#50A8EE] bg-[#50A8EE]"
                    : "border-[#ccc]"
                }`}
              >
                {pollType === "public" && (
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
                  Public Poll
                </Text>
                <Text
                  className={`text-[12px] tracking-wide ${
                    theme === "dark" ? "text-[#fff]" : "text-black"
                  }`}
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  Anyone can vote
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setPollType("private")}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-2.5 ${
                  pollType === "private"
                    ? "border-[#50A8EE] bg-[#50A8EE]"
                    : "border-[#ccc]"
                }`}
              >
                {pollType === "private" && (
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
                  Private Poll
                </Text>
                <Text
                  className={`text-[12px] tracking-wide w-2/3 ${
                    theme === "dark" ? "text-[#fff]" : "text-black"
                  }`}
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  Only people with access can vote with the link
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <Toast config={toastConfig} />

        <Modal
          transparent={true}
          visible={pickerVisible}
          animationType="none"
          onRequestClose={() => setPickerVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-end"
            activeOpacity={1}
            onPress={() => setPickerVisible(false)}
          >
            <View
              className={`w-full max-h-[200px] ${
                theme === "dark" ? "bg-[#262626]" : "bg-[#F5F5F7]"
              }`}
            >
              <FlatList
                data={durationUnits}
                renderItem={renderPickerItem}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </TouchableOpacity>
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
                    Creating poll
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
                  Do you want to stop creating your poll?
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
          transparent
          visible={successModalVisible}
          animationType="slide"
          onRequestClose={() => setSuccessModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
            }}
          >
            <View
              style={{
                backgroundColor: theme === "dark" ? "#262626" : "white",
                padding: 20,
                borderRadius: 20,
                width: "80%",
              }}
            >
              <Text
                style={{
                  color: theme === "dark" ? "white" : "black",
                  fontFamily: "OpenSans-SemiBold",
                  fontSize: 16,
                  textAlign: "center",
                  marginBottom: 10,
                }}
              >
                Your Poll Has Been Posted
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: "#50A8EE",
                  padding: 12,
                  borderRadius: 10,
                  alignItems: "center",
                  marginBottom: 10,
                }}
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.navigate("HomeScreen");
                }}
              >
                <Text
                  style={{ color: "white", fontFamily: "OpenSans-Regular" }}
                >
                  Back To Home
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSuccessModalVisible(false)}>
                <Text
                  style={{
                    color: theme === "dark" ? "white" : "black",
                    fontFamily: "OpenSans-Medium",
                    textAlign: "center",
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

export default CreatePollPage;