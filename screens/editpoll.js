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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import useLoadFonts from "../src/hooks/useLoadFonts"; // Adjust path as needed
import { toastConfig, showToast } from "../src/utils/toastconfig"; // Adjust path as needed
import { ThemeContext } from "../src/components/ThemeContext"; // Adjust path as needed

SplashScreen.preventAutoHideAsync();

const EditPoll = ({ route, navigation }) => {
  const { pollData } = route.params; // Get poll data from navigation params
  const { theme } = useContext(ThemeContext);

  const convertDurationFromMinutes = (minutes) => {
    if (minutes >= 1440) {
      return { value: Math.floor(minutes / 1440), unit: "days" };
    } else if (minutes >= 60) {
      return { value: Math.floor(minutes / 60), unit: "hours" };
    } else {
      return { value: minutes, unit: "minutes" };
    }
  };

  const initialDuration = convertDurationFromMinutes(pollData.duration || 0);

  // Initialize state with poll data
  const [title, setTitle] = useState(pollData.title || "");
  const [description, setDescription] = useState(pollData.description || "");
  const [options, setOptions] = useState(pollData.choices.map(choice => choice.option_text) || ["", ""]);
  const [pollType, setPollType] = useState(pollData.type || "public");
  const [duration, setDuration] = useState(initialDuration.value);
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
    let durationInMinutes;
    switch (durationUnit) {
      case "minutes":
        durationInMinutes = duration;
        break;
      case "hours":
        durationInMinutes = duration * 60;
        break;
      case "days":
        durationInMinutes = duration * 24 * 60;
        break;
      default:
        durationInMinutes = duration;
    }
    return durationInMinutes;
  };

  const hasProgress = () => {
    return (
      title.trim() !== pollData.title ||
      description.trim() !== (pollData.description || "") ||
      JSON.stringify(options) !== JSON.stringify(pollData.choices.map(choice => choice.option_text)) ||
      getDurationInMinutes() !== (pollData.duration || 0) ||
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
      const [userId, token] = await Promise.all([
        AsyncStorage.getItem("user_id"),
        AsyncStorage.getItem("auth_token"),
      ]);

      const durationInMinutes = getDurationInMinutes();
      const API_URL = `http://192.168.1.21:8000/api/editpoll/${pollData.id}`;

      const payload = {
        user_id: parseInt(userId, 10),
        title: title.trim(),
        description: description?.trim() || "",
        type: pollType,
        choices: options.map(opt => opt.trim()),
        duration: durationInMinutes,
      };
      console.log("Requesting URL:", API_URL);
      console.log("Payload:", payload);

      const { data } = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("API Response:", data);

      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsLoading(false);

      showToast("success", "Poll updated successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating poll:", error.response?.data || error);
      const errorMessage = error.response?.data?.error || "Failed to update poll.";
      showToast("error", errorMessage);
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
    <View className={`flex-1 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"}`}>
      <View
        className={`flex-row items-center px-2.5 justify-between py-2 ${
          theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"
        }`}
        style={{ height: 60 }}
      >
        <View className="flex-row items-center">
          <TouchableHighlight
            onPress={handleClose}
            className="mr-3 mt-1 rounded-full"
            underlayColor={theme === "dark" ? "#555555" : "#F5F5F7"}
          >
            <Icon name="close" size={22} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
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
        className={`flex-1 px-2.5 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"}`}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          className={`border-b rounded-lg px-2.5 h-16 mb-4 text-[13px] tracking-wide ${
            theme === "dark" ? "border-[#444] text-white" : "border-[#ccc] text-black"
          }`}
          value={title}
          onChangeText={setTitle}
          placeholder="Title goes here....."
          style={{ fontFamily: "OpenSans-Medium" }}
          placeholderTextColor={theme === "dark" ? "white" : "black"}
        />

        <TextInput
          className={`border-b rounded-lg px-2.5 h-20 mb-10 text-[13px] tracking-wide ${
            theme === "dark" ? "border-[#444] text-white" : "border-[#ccc] text-black"
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
          className={`text-[13px] mb-3 tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
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
          </View>
        ))}

        {options.length < 6 && (
          <TouchableOpacity
            className="flex-row items-left mb-5 mt-2 justify-end"
            onPress={() => setOptions([...options, ""])}
          >
            <Icon name="plus" size={19} color={theme === "dark" ? "#60B8FF" : "#50A8EE"} />
            <Text
              className="text-[12px] text-[#50A8EE] tracking-wide"
              style={{ fontFamily: "OpenSans-Medium" }}
            >
              Add Option
            </Text>
          </TouchableOpacity>
        )}

        <Text
          className={`text-[13px] mb-3 tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
          style={{ fontFamily: "OpenSans-Bold" }}
        >
          Set Duration
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
            value={duration.toString()}
            onChangeText={(text) => {
              const newDuration = parseInt(text, 10) || "";
              setDuration(newDuration);
            }}
            keyboardType="numeric"
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
              className={`text-[12px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
              style={{ fontFamily: "OpenSans-Medium" }}
            >
              {durationUnits.find((unit) => unit.value === durationUnit)?.label || "Select"}
            </Text>
            <Icon name="chevron-down" size={20} color={theme === "dark" ? "#fff" : "#444"} />
          </TouchableOpacity>
        </View>

        <Text
          className={`text-[13px] mb-3 tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
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
                pollType === "public" ? "border-[#50A8EE] bg-[#50A8EE]" : "border-[#ccc]"
              }`}
            >
              {pollType === "public" && (
                <View className="w-2 h-2 rounded-full bg-white self-center mt-1" />
              )}
            </View>
            <View>
              <Text
                className={`text-[13px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
                style={{ fontFamily: "OpenSans-Semibold" }}
              >
                Public Poll
              </Text>
              <Text
                className={`text-[12px] tracking-wide ${theme === "dark" ? "text-[#fff]" : "text-black"}`}
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
                pollType === "private" ? "border-[#50A8EE] bg-[#50A8EE]" : "border-[#ccc]"
              }`}
            >
              {pollType === "private" && (
                <View className="w-2 h-2 rounded-full bg-white self-center mt-1" />
              )}
            </View>
            <View>
              <Text
                className={`text-[13px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
                style={{ fontFamily: "OpenSans-Semibold" }}
              >
                Private Poll
              </Text>
              <Text
                className={`text-[12px] tracking-wide w-2/3 ${theme === "dark" ? "text-[#fff]" : "text-black"}`}
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
            className={`w-full max-h-[200px] ${theme === "dark" ? "bg-[#262626]" : "bg-[#F5F5F7]"}`}
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
              className={`w-full p-6 rounded-t-3xl ${theme === "dark" ? "bg-[#262626]" : "bg-[#FFFFFF]"}`}
            >
              <Text
                className={`text-[14px] tracking-wide mb-3 ${theme === "dark" ? "text-white" : "text-black"}`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Do you want to stop editing your poll?
              </Text>
              <Text
                className={`text-[14px] tracking-wide mb-10 ${theme === "dark" ? "text-[#ccc]" : "text-black"}`}
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
              className={`w-full p-6 rounded-t-3xl ${theme === "dark" ? "bg-[#262626]" : "bg-[#FFFFFF]"}`}
            >
              <Text
                className={`text-[14px] tracking-wide mb-3 ${theme === "dark" ? "text-white" : "text-black"}`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Are you sure you want to save the changes?
              </Text>
              <Text
                className={`text-[14px] tracking-wide mb-10 ${theme === "dark" ? "text-[#ccc]" : "text-black"}`}
                style={{ fontFamily: "OpenSans-Regular" }}
              >
                This will update the poll with your current changes. Once you add a new row, it cannot be deleted unless you delete the poll.
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

      <Toast config={toastConfig} />
    </View>
  );
};

export default EditPoll;