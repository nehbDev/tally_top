import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as SplashScreen from "expo-splash-screen";
import { TextInput } from "react-native-gesture-handler";
import * as Clipboard from "expo-clipboard";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useLoadFonts from "../src/hooks/useLoadFonts";
import { ThemeContext } from "../src/components/ThemeContext";
import { getApiUrl } from "../apiConfig";

SplashScreen.preventAutoHideAsync();

const PrivatePoll = ({ navigation, route }) => {
  const [link, setLink] = useState(route.params?.pollLink || "");
  const [loading, setLoading] = useState(false);
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState(false);
  const [warning, setWarning] = useState(false);
  const [user, setUser] = useState(null);
  const [countdown, setCountdown] = useState("");
  const { theme } = useContext(ThemeContext);
  const { loaded, fonterror } = useLoadFonts();
  const [activeTab, setActiveTab] = useState("private");

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (loaded || fonterror) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fonterror]);

  if (!loaded && !fonterror) return null;

  // Countdown timer effect
  useEffect(() => {
    if (!poll || !poll.expirationTime) {
      // Handle non-expiring polls
      if (poll && poll.duration === null) {
        setCountdown("Ongoing");
        setPoll((prev) => ({ ...prev, isExpired: false }));
      }
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expirationTime = new Date(poll.expirationTime).getTime();
      const remainingTime = expirationTime - now;

      if (remainingTime <= 0) {
        setCountdown("Expired");
        setPoll((prev) => ({ ...prev, isExpired: true }));
        return;
      }

      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setCountdown(`${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [poll]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setUser(parsedUser);
      } catch (error) {
        console.error("Error fetching user:", error.message);
      }
    };

    fetchUser();
  }, []);

  // Reset error states when link changes
  useEffect(() => {
    if (link !== (route.params?.pollLink || "")) {
      setError(false);
      setWarning(false);
      setPoll(null);
    }
  }, [link, route.params?.pollLink]);

  const handlePollPress = () => {
    if (poll) {
      navigation.navigate("PollDisplay", { poll });
    }
  };

  const showToast = (type, message) => {
    console.log(`${type}: ${message}`);
    if (type === "error") {
      Alert.alert("Error", message);
    }
  };

  const handleJoinPoll = async () => {
    if (!link.trim()) {
      Alert.alert("Error", "Please enter a poll link");
      return;
    }

    setLoading(true);
    setError(false);
    setWarning(false);
    setPoll(null);

    console.log("Searching for link:", link.trim());

    try {
      const API_URL = getApiUrl("search-by-link");

      const response = await axios.post(
        API_URL,
        { link: link.trim() },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Search response:", response.data);

      if (response.data.success && response.data.poll) {
        const fetchedPoll = response.data.poll;

        // Handle non-expiring polls (duration === null)
        const isNonExpiring = fetchedPoll.duration === null;
        const expirationTime = isNonExpiring
          ? null
          : new Date(fetchedPoll.created_at).getTime() +
            fetchedPoll.duration * 60000;

        const formattedPoll = {
          ...fetchedPoll,
          timeAgo: moment(fetchedPoll.created_at).fromNow(),
          isCreatedByMe: user && fetchedPoll.user?.id === user.id,
          totalVotes: fetchedPoll.total_votes || 0,
          duration: fetchedPoll.duration || null,
          expirationTime: expirationTime,
          isExpired: isNonExpiring ? false : Boolean(fetchedPoll.is_expired),
        };

        setPoll(formattedPoll);
        console.log("Poll found and formatted:", formattedPoll);
      } else {
        const errorMessage = response.data.message || "Invalid poll link";
        handleError(errorMessage);
      }
    } catch (error) {
      console.error("Search Error:", error);

      let errorMessage = "An error occurred while searching for the poll";

      if (error.code === "ECONNABORTED") {
        errorMessage =
          "Request timeout. Please check your connection and try again.";
      } else if (error.response) {
        if (error.response.status === 404) {
          errorMessage =
            error.response.data?.message ||
            "Private poll link not found or has expired";
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || "Invalid request";
        } else {
          errorMessage =
            error.response.data?.message ||
            `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      handleError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (errorMessage) => {
    console.error("Error:", errorMessage);

    if (
      errorMessage.toLowerCase().includes("expired") ||
      errorMessage.toLowerCase().includes("not found")
    ) {
      setWarning(true);
    } else {
      setError(true);
    }

    Alert.alert("Error", errorMessage);
  };

  const clearLink = () => {
    setLink("");
    setError(false);
    setWarning(false);
    setPoll(null);
  };

  const copyToClipboard = async () => {
    if (poll?.link) {
      try {
        await Clipboard.setStringAsync(poll.link);
        showToast("success", "Link copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        Alert.alert("Error", "Failed to copy link to clipboard");
      }
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        setLink(clipboardContent);
        setError(false);
        setWarning(false);
        setPoll(null);
      }
    } catch (error) {
      console.error("Error pasting from clipboard:", error);
    }
  };

  const getBorderColor = () => {
    if (error) return "#FF4D4D";
    if (warning) return "#FFC107";
    if (poll) return "#50A8EE";
    return "#E6E6E6";
  };

  const getInputBackgroundColor = () => {
    return theme === "dark" ? "#2A2A2A" : "#FFFFFF";
  };

  const getTextColor = () => {
    return theme === "dark" ? "#FFFFFF" : "#000000";
  };

  return (
    <>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme === "dark" ? "#1A1A1A" : "#F5F5F7"}
      />
      <ScrollView
        className={`flex-grow ${
          theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"
        }`}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-2.5 h-full">
          <View className="pt-5 pb-4 items-center">
            {/* Input Section */}
            <View
              className="flex-row items-center rounded-lg border px-2.5 mb-2"
              style={{
                borderColor: getBorderColor(),
                backgroundColor: getInputBackgroundColor(),
              }}
            >
              <TextInput
                className="flex-1 h-[45px] px-3 text-[12px] tracking-wide"
                style={{
                  fontFamily: "OpenSans-Medium",
                  color: getTextColor(),
                }}
                autoCorrect={false}
                autoCapitalize="none"
                value={link}
                onChangeText={setLink}
                placeholder="Enter poll link"
                placeholderTextColor={theme === "dark" ? "#888" : "#444"}
                multiline={false}
                returnKeyType="search"
                onSubmitEditing={handleJoinPoll}
              />

              {link.length > 0 && (
                <TouchableOpacity className="p-1.5 mr-1" onPress={clearLink}>
                  <Icon name="close" size={20} color="#555" />
                </TouchableOpacity>
              )}

              <TouchableOpacity className="p-1.5" onPress={pasteFromClipboard}>
                <Icon name="content-paste" size={20} color="#50A8EE" />
              </TouchableOpacity>
            </View>

            {/* Error/Warning Messages */}
            {error && (
              <Text className="text-[#FF4D4D] text-xs mb-2 text-center">
                Please check the link and try again
              </Text>
            )}
            {warning && (
              <Text className="text-[#FFC107] text-xs mb-2 text-center">
                Poll not found or has expired
              </Text>
            )}

            {/* Join Button */}
            <TouchableOpacity
              className={`w-full p-3 rounded-xl items-center mb-4 mt-1 ${
                loading || !link.trim() ? "bg-gray-400" : "bg-[#50A8EE]"
              }`}
              onPress={handleJoinPoll}
              disabled={loading || !link.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  className="text-white text-[15px] tracking-wider"
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  {poll ? "Search Again" : "Join Poll"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Poll Display */}
          {poll && (
            <TouchableOpacity
              onPress={handlePollPress}
              className={`p-4 mb-2.5 rounded-lg shadow-md ${
                theme === "dark" ? "bg-[#2A2A2A]" : "bg-white"
              }`}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row justify-between flex-1">
                  <Text
                    className={`text-xs tracking-tight ${
                      theme === "dark" ? "text-[#BBB]" : "text-[#444]"
                    }`}
                    style={{ fontFamily: "Inter-Regular" }}
                  >
                    By{" "}
                    {poll.isCreatedByMe
                      ? "Me"
                      : poll.user?.username || "Unknown"}
                  </Text>
                </View>
                <Icon name="lock-outline" size={20} color="#50A8EE" />
              </View>

              {/* Time */}
              <Text
                className={`text-[11px] tracking-tight mb-3 ${
                  theme === "dark" ? "text-[#999]" : "text-[#555]"
                }`}
                style={{ fontFamily: "Inter-Medium" }}
              >
                {poll.timeAgo}
              </Text>

              {/* Title */}
              <View className="mb-4">
                <Text
                  className={`text-xl ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                  style={{ fontFamily: "Inter-Semibold" }}
                >
                  {poll.title || "Private Poll"}
                </Text>
              </View>

              {/* Footer */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Text
                    className="text-[11px] text-[#50A8EE] tracking-tight mr-3"
                    style={{ fontFamily: "Inter-Medium" }}
                  >
                    {poll.totalVotes} votes
                  </Text>
                  <TouchableOpacity onPress={copyToClipboard} className="mr-3">
                    <Icon name="content-copy" size={15} color="#555" />
                  </TouchableOpacity>
                  <Icon name="comment-outline" size={14.5} color="#555" />
                </View>

                <Text
                  className={`text-[11px] tracking-tight ${
                    poll.isExpired ? "text-[#FF3B30]" : "text-[#555]"
                  }`}
                  style={{ fontFamily: "Inter-Medium" }}
                >
                  {countdown}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </>
  );
};

export default PrivatePoll;