import React, { useState, useContext, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
  Image,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as SplashScreen from "expo-splash-screen";
import useFetchUserAndPolls from "../src/utils/userandpolls";
import useLoadFonts from "../src/hooks/useLoadFonts";
import { ThemeContext } from "../src/components/ThemeContext";

SplashScreen.preventAutoHideAsync();

const avatarMap = {
  "default-avatar.webp": require("../assets/images/default-avatar.webp"),
  "female-avatar.jpg": require("../assets/images/female-avatar.jpg"),
  "male-avatar.png": require("../assets/images/male-avatar.png"),
};

const HomeScreen = ({ navigation }) => {
  const {
    user,
    visiblePolls,
    expiredPolls,
    remainingTimes,
    refreshing,
    fetchUserAndPolls,
    error,
  } = useFetchUserAndPolls();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("public");

  const { loaded, fonterror } = useLoadFonts();
  useEffect(() => {
    if (loaded || fonterror) {
      SplashScreen.hideAsync();
    }
  }, [loaded, fonterror]);

  if (!loaded && !fonterror) return null;

  const { theme } = useContext(ThemeContext);

  const handlePollPress = (poll) => {
    console.log("Navigating to PollDisplay with poll:", poll);
    navigation.navigate("PollDisplay", { poll });
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    if (tab === "private") {
      navigation.navigate("PrivatePoll", { activeTab: "private" });
    }
  };

  const handleCreatePoll = () => {
    navigation.navigate("CreatePollPage");
  };

  const filteredPolls = useMemo(() => {
    return visiblePolls
      .filter((poll) => poll.type === "public")
      .filter((poll) => {
        const lowerCaseQuery = searchQuery.toLowerCase();
        const username = poll.isCreatedByMe
          ? "By Me"
          : poll.user?.username || "Unknown";
        const title = poll.title || "";
        const link = poll.link || "";
        return (
          username.toLowerCase().includes(lowerCaseQuery) ||
          title.toLowerCase().includes(lowerCaseQuery) ||
          link.toLowerCase().includes(lowerCaseQuery)
        );
      });
  }, [visiblePolls, searchQuery]);

  const refreshControlTintColor = theme === "dark" ? "#60B8FF" : "#50A8EE";
  const refreshControlColors = theme === "dark" ? ["#60B8FF"] : ["#50A8EE"];
  const progressBackgroundColor = theme === "dark" ? "#2A2A2A" : "#F5F5F7";

  return (
    <View
      className={`flex-1 px-1 h-full ${
        theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"
      }`}
    >
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
            placeholder="Search by username or title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme === "dark" ? "#ccc" : "#444"}
            style={{ fontFamily: "OpenSans-Medium" }}
          />
          <Icon
            name="magnify"
            size={22}
            color={theme === "dark" ? "#fff" : "#555"}
            className="mr-2.5"
          />
        </View>
      </View>

      {error && (
        <Text
          className="text-center mt-4 text-red-500 text-[14px]"
          style={{ fontFamily: "OpenSans-Medium" }}
        >
          {error}
        </Text>
      )}

      <ScrollView
        className="w-full px-2.5 mt-2.5"
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchUserAndPolls}
            tintColor={refreshControlTintColor}
            colors={refreshControlColors}
            progressBackgroundColor={progressBackgroundColor}
          />
        }
      >
        {filteredPolls.length > 0 ? (
          filteredPolls.map((poll, index) => (
            <TouchableOpacity
              key={poll.id || `temp-${index}`}
              disabled={expiredPolls[poll.id]}
              className={`p-4 mb-2.5 rounded-lg shadow-xl elevation-7 ${
                theme === "dark" ? "bg-[#262626]" : "bg-white"
              } ${expiredPolls[poll.id] ? "opacity-50" : "opacity-100"}`}
              onPress={() => !expiredPolls[poll.id] && handlePollPress(poll)}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-start">
                  <Image
                    source={
                      poll.isCreatedByMe &&
                      user?.avatar &&
                      avatarMap[user.avatar]
                        ? avatarMap[user.avatar]
                        : poll.user?.avatar && avatarMap[poll.user.avatar]
                        ? avatarMap[poll.user.avatar]
                        : require("../assets/images/default-avatar.webp")
                    }
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
                      {poll.isCreatedByMe
                        ? "By Me"
                        : poll.user?.username || "Unknown"}
                    </Text>
                    <Text
                      className={`text-[11px] tracking-normal ${
                        theme === "dark" ? "text-[#ccc]" : "text-[#555]"
                      }`}
                      style={{ fontFamily: "OpenSans-Medium" }}
                    >
                      {poll.timeAgo}
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
                ellipsizeMode="tail"
              >
                {poll.title || "Untitled Poll"}
              </Text>
              <Text
                className={`text-[15px] mb-6 tracking-wide ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-Medium" }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {poll.description ? (
                  poll.description
                ) : (
                  <Text className="italic text-[12px]">No description</Text>
                )}
              </Text>
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2.5">
                  <Text
                    className="text-[11px] text-[#50A8EE] tracking-wide"
                    style={{ fontFamily: "OpenSans-SemiBold" }}
                  >
                    {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
                  </Text>
                  <View className="flex-row items-center">
                    <Icon
                      name="bookmark-outline"
                      size={15}
                      color={theme === "dark" ? "#fff" : "#555"}
                    />
                    <Text
                      className={`ml-0.5 text-[11px] tracking-tight ${
                        theme === "dark" ? "text-[#ccc]" : "text-[#555]"
                      }`}
                    >
                      {poll.totalBookmarks}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Icon
                      name="comment-outline"
                      size={14.5}
                      color={theme === "dark" ? "#fff" : "#555"}
                    />
                    <Text
                      className={`ml-0.5 text-[11px] tracking-tight ${
                        theme === "dark" ? "text-[#ccc]" : "text-[#555]"
                      }`}
                    >
                      {poll.totalComments}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-[10px] tracking-wide ${
                    expiredPolls[poll.id] || poll.duration !== null
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                  style={{
                    fontFamily:
                      expiredPolls[poll.id] || poll.duration === null
                        ? "OpenSans-Bold"
                        : "OpenSans-Regular",
                  }}
                >
                  {remainingTimes[poll.id] || "Calculating..."}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text
            className="text-center mt-12 text-lg"
            style={{
              fontFamily: "OpenSans-Medium",
              color: theme === "dark" ? "#ccc" : "#555",
            }}
          >
            {refreshing ? "Loading polls..." : "No public polls available."}
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity
        onPress={handleCreatePoll}
        className={`absolute bottom-5 right-5 rounded-full w-16 h-16 flex items-center justify-center shadow-lg elevation-5 ${
          theme === "dark" ? "bg-[#60B8FF]" : "bg-[#50A8EE]"
        }`}
      >
        <Icon
          name="plus"
          size={30}
          color={theme === "dark" ? "#1A1A1A" : "white"}
        />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;