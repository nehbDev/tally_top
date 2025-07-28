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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SplashScreen from "expo-splash-screen";
import useLoadFonts from "../src/hooks/useLoadFonts";
import { toastConfig, showToast } from "../src/utils/toastconfig";
import { ThemeContext } from "../src/components/ThemeContext";
import { getApiUrl } from "../apiConfig";

SplashScreen.preventAutoHideAsync();

const EditPoll = ({ route, navigation }) => {
  const { pollData } = route.params;
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  const convertDurationFromMinutes = (minutes) => {
    if (!minutes) return { value: "", unit: "minutes" }; // Handle null/undefined duration
    if (minutes >= 1440) {
      return { value: Math.floor(minutes / 1440), unit: "days" };
    } else if (minutes >= 60) {
      return { value: Math.floor(minutes / 60), unit: "hours" };
    } else {
      return { value: minutes, unit: "minutes" };
    }
  };

  const initialDuration = convertDurationFromMinutes(pollData.duration);

  const [title, setTitle] = useState(pollData.title || "");
  const [description, setDescription] = useState(pollData.description || "");
  const [options, setOptions] = useState(
    pollData.choices.map((choice) => ({
      option_text: choice.option_text,
      isEditable: false,
    })) || [
      { option_text: "", isEditable: true },
      { option_text: "", isEditable: true },
    ]
  );
  const [pollType, setPollType] = useState(pollData.type || "public");
  const [duration, setDuration] = useState(initialDuration.value.toString()); // Convert to string
  const [durationUnit, setDurationUnit] = useState(initialDuration.unit);
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);
  const [confirmSaveVisible, setConfirmSaveVisible] = useState(false);

  const { loaded, fonterror } = useLoadFonts();
  if (!loaded && !fonterror) return null;

  const durationUnits = [
    { label: "Minutes", value: "minutes" },
    { label: "Hours", value: "hours" },
    { label: "Days", value: "days" },
  ];

  const getDurationInMinutes = () => {
    if (!duration || isNaN(parseInt(duration, 10))) return null; // Return null if no duration
    const parsedDuration = parseInt(duration, 10);
    switch (durationUnit) {
      case "minutes":
        return parsedDuration;
      case "hours":
        return parsedDuration * 60;
      case "days":
        return parsedDuration * 24 * 60;
      default:
        return parsedDuration;
    }
  };

  const hasProgress = () => {
    const durationInMinutes = getDurationInMinutes();
    return (
      title.trim() !== pollData.title ||
      description.trim() !== (pollData.description || "") ||
      JSON.stringify(options.map((opt) => opt.option_text)) !==
        JSON.stringify(pollData.choices.map((choice) => choice.option_text)) ||
      durationInMinutes !== (pollData.duration || null) ||
      pollType !== (pollData.type || "public")
    );
  };

  const handleClose = () => {
    if (hasProgress()) {
      setConfirmCloseVisible(true);
    } else {
      navigation.goBack();
    }
  };

  const handleSavePress = () => {
    setConfirmSaveVisible(true);
  };

  const handleEditPoll = async () => {
    try {
      if (!title.trim()) {
        showToast("error", "Poll title is required.");
        return;
      }
      if (options.length < 2 || options.some((opt) => !opt.option_text.trim())) {
        showToast("error", "At least two non-empty options are required.");
        return;
      }

      setIsLoading(true);
      const [userId, token] = await Promise.all([
        AsyncStorage.getItem("user_id"),
        AsyncStorage.getItem("auth_token"),
      ]);

      if (!userId || !token) {
        showToast("error", "Authentication credentials are missing.");
        return;
      }

      const durationInMinutes = getDurationInMinutes();
      const API_URL = getApiUrl(`editpoll/${pollData.id}`);

      const payload = {
        user_id: parseInt(userId, 10),
        title: title.trim(),
        description: description?.trim() || "",
        type: pollType,
        choices: options.map((opt) => opt.option_text.trim()),
      };

      // Only include duration if it’s valid
      if (durationInMinutes !== null) {
        payload.duration = durationInMinutes;
      }

      console.log("Requesting URL:", API_URL);
      console.log("Payload:", payload);

      const { data } = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("API Response:", data);

      if (data.success || data.message === "Poll updated successfully") {
        showToast("success", "Poll updated successfully");
        const updatedPoll = {
          ...pollData,
          title: title.trim(),
          description: description?.trim() || "",
          type: pollType,
          choices: options.map((opt, index) => ({
            id: pollData.choices[index]?.id || index + 1,
            option_text: opt.option_text.trim(),
          })),
          duration: durationInMinutes,
        };
        navigation.reset({
          index: 1,
          routes: [
            { name: "HomeScreen" },
            { name: "PollDisplay", params: { poll: updatedPoll } },
          ],
        });
      } else {
        throw new Error(data.error || "Unexpected response from server.");
      }
    } catch (error) {
      console.error("Error updating poll:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMessage =
        error.response?.data?.error || "Failed to update poll.";
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        theme === "dark"
          ? "border-[#444] bg-[#1A1A1A]"
          : "border-[#ccc] bg-[#F5F5F7]"
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
      style={{
        flex: 1,
        backgroundColor: theme === "dark" ? "#1A1A1A" : "#FFFFFF",
      }}
    >
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
              name="close"
              size={22}
              color={theme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </TouchableHighlight>
          <Text
            className={`text-[18px] tracking-wider ${
              theme === "dark" ? "text-white" : "text-[#50A8EE]"
            }`}
            style={{ fontFamily: "Raleway-Bold" }}
          >
            Edit Poll
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSavePress}
          disabled={isLoading}
          className="bg-[#50A8EE] px-8 py-1.5 rounded-lg"
        >
          <Text
            className="text-[13px] tracking-wide text-white"
            style={{ fontFamily: "OpenSans-Regular" }}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        className={`flex-1 px-2.5 ${
          theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"
        }`}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          className={`border-b rounded-lg px-2.5 h-16 mb-4 text-[13px] tracking-wide ${
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
          className={`border-b rounded-lg px-2.5 h-20 mb-10 text-[13px] tracking-wide ${
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
              } ${!option.isEditable ? "opacity-50" : ""}`}
              value={option.option_text}
              onChangeText={(text) => {
                if (option.isEditable) {
                  const newOptions = [...options];
                  newOptions[index] = {
                    ...newOptions[index],
                    option_text: text,
                  };
                  setOptions(newOptions);
                }
              }}
              placeholder={`Option ${index + 1}`}
              style={{ fontFamily: "OpenSans-Medium" }}
              placeholderTextColor={theme === "dark" ? "#fff" : "#000"}
              editable={option.isEditable}
            />
          </View>
        ))}

        {options.length < 6 && (
          <TouchableOpacity
            className="flex-row items-left mb-5 mt-2 justify-end"
            onPress={() =>
              setOptions([...options, { option_text: "", isEditable: true }])
            }
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
        )}

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
              {durationUnits.find((unit) => unit.value === durationUnit)
                ?.label || "Select"}
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

      <Modal transparent={true} animationType="fade" visible={isLoading}>
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-3/5 items-center">
            <ActivityIndicator size="large" color="#50A8EE" />
            <Text
              className="text-white text-[15px] tracking-wide"
              style={{ fontFamily: "OpenSans-Medium" }}
            >
              Updating poll{dots}
            </Text>
          </View>
        </View>
      </Modal>

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
                theme === "dark" ? "bg-[#262626]" : "bg-[#FFFFFF]"
              }`}
            >
              <Text
                className={`text-[14px] tracking-wide mb-3 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Do you want to stop editing your poll?
              </Text>
              <Text
                className={`text-[14px] tracking-wide mb-10 ${
                  theme === "dark" ? "text-[#ccc]" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-Regular" }}
              >
                If you stop now, you’ll lose any changes you made.
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
                    Discard
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
        visible={confirmSaveVisible}
        animationType="none"
        onRequestClose={() => setConfirmSaveVisible(false)}
      >
        <View className="flex-1 bg-black/50">
          <TouchableOpacity
            className="flex-1 w-full justify-end items-center"
            activeOpacity={1}
            onPress={() => setConfirmSaveVisible(false)}
          >
            <View
              className={`w-full p-6 rounded-t-3xl ${
                theme === "dark" ? "bg-[#262626]" : "bg-[#FFFFFF]"
              }`}
            >
              <Text
                className={`text-[14px] tracking-wide mb-3 ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Are you sure you want to save the changes?
              </Text>
              <Text
                className={`text-[14px] tracking-wide mb-10 ${
                  theme === "dark" ? "text-[#ccc]" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-Regular" }}
              >
                This will update the poll with your current changes. Once you
                add a new row, it cannot be deleted unless you delete the poll.
              </Text>
              <View className="flex-row gap-2 justify-between">
                <TouchableOpacity
                  onPress={() => setConfirmSaveVisible(false)}
                  className="flex-1 border border-[#FF5555] p-2 rounded-lg"
                >
                  <Text
                    className={`text-[13px] tracking-wide text-center ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                    style={{ fontFamily: "OpenSans-Regular" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    setConfirmSaveVisible(false);
                    await handleEditPoll();
                  }}
                  className="flex-1 bg-[#50A8EE] p-2 rounded-lg"
                >
                  <Text
                    className="text-white text-[13px] tracking-wide text-center"
                    style={{ fontFamily: "OpenSans-Regular" }}
                  >
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EditPoll;