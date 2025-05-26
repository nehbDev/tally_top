import { FlatList, View, Text, TouchableOpacity, TouchableHighlight } from "react-native";
import { useState, useEffect, useCallback, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Clipboard from "expo-clipboard"; // Import Clipboard for copy functionality
import { ThemeContext } from "../src/components/ThemeContext"; // Adjust path as needed

const API_URL = "http://192.168.1.21:8000/api/getPolls"; 
const MyPublicPolls = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [userPolls, setUserPolls] = useState([]);
  const [visiblePolls, setVisiblePolls] = useState([]);
  const [expiredPolls, setExpiredPolls] = useState({});
  const [remainingTimes, setRemainingTimes] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserCreatedPolls = useCallback(async () => {
    setRefreshing(true);
    try {
      const storedUser = await AsyncStorage.getItem("user");
      const storedUserId = await AsyncStorage.getItem("user_id");
      console.log("Raw stored user:", storedUser);
      console.log("Stored user_id:", storedUserId);
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      console.log("Parsed user:", parsedUser);
      setUser(parsedUser);

      if (!parsedUser) {
        console.log("No user found in AsyncStorage. User might not be logged in.");
        setUserPolls([]);
        setVisiblePolls([]);
        return;
      }
      if (!storedUserId) {
        console.log("User found but no user_id present in AsyncStorage.");
        setUserPolls([]);
        setVisiblePolls([]);
        return;
      }

      const token = await AsyncStorage.getItem("auth_token");
      console.log("Fetching user-created polls with token:", token);

      const { data } = await axios.get(API_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      console.log("API Response:", data);

      if (!data.success || !Array.isArray(data.polls)) {
        console.error("Invalid poll data:", data);
        setUserPolls([]);
        setVisiblePolls([]);
        return;
      }

      console.log("All polls:", data.polls);

      const userCreatedPolls = data.polls
        .filter((poll) => {
          const isPublic = poll.type === "public";
          const parsedUserId = String(storedUserId);
          const pollUserId = String(poll.user_id);
          const isUserCreated = pollUserId === parsedUserId;
          console.log(
            `Poll ID: ${poll.id}, Type: ${poll.type}, Poll User ID: ${poll.user_id}, User ID: ${parsedUserId}, Matches: ${isUserCreated}`
          );
          return isPublic && isUserCreated;
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((poll) => ({
          ...poll,
          timeAgo: moment(poll.created_at).fromNow(),
          totalVotes: poll.total_votes,
          duration: poll.duration || 60,
          expirationTime: new Date(new Date(poll.created_at).getTime() + (poll.duration || 60) * 60_000),
          isExpired: poll.is_expired,
        }));

      console.log("User-created polls:", userCreatedPolls);
      setUserPolls(userCreatedPolls);
      setVisiblePolls(userCreatedPolls);
    } catch (error) {
      console.error("Error fetching user-created polls:", error.message);
      console.error("Response:", error.response?.data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme === "dark" ? "#1A1A1A" : "#F5F5F7",
        height: 60,
        elevation: theme === "dark" ? 2 : 1,
        shadowOpacity: theme === "dark" ? 4 : 2,
      },
      headerTintColor: theme === "dark" ? "#60B8FF" : "#50A8EE",
      headerTitle: "My Public Polls",
      headerTitleStyle: {
        fontFamily: "Raleway-Bold",
        fontSize: 18,
        letterSpacing: 0.5,
        color: theme === "dark" ? "#FFFFFF" : "#50A8EE",
      },
      headerLeft: () => (
        <TouchableHighlight
          underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
          onPress={() => navigation.goBack()}
          className="px-2.5 rounded-full mt-1 ml-2"
        >
          <Icon name="arrow-left" size={20} color={theme === "dark" ? "#FFFFFF" : "#000000"} />
        </TouchableHighlight>
      ),
    });
  }, [navigation, theme]);

  useEffect(() => {
    if (!userPolls.length) {
      setVisiblePolls([]);
      setExpiredPolls({});
      setRemainingTimes({});
      return;
    }

    const updatePolls = () => {
      const now = Date.now();
      let newExpiredPolls = {};
      let newRemainingTimes = {};
      let updatedVisiblePolls = [];

      userPolls.forEach((poll) => {
        const expirationTime = poll.expirationTime.getTime();
        const gracePeriodEnd = expirationTime + 60_000;
        const isExpired = now > expirationTime;
        const isBeyondGracePeriod = now > gracePeriodEnd;

        newExpiredPolls[poll.id] = isExpired;

        if (!isBeyondGracePeriod) {
          updatedVisiblePolls.push(poll);
          const timeDiff = expirationTime - now;

          if (timeDiff <= 0) {
            newRemainingTimes[poll.id] = "Expired";
          } else {
            const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
            const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);

            if (days > 0) {
              newRemainingTimes[poll.id] = `${days} day${days !== 1 ? "s" : ""} left`;
            } else if (hours > 0) {
              newRemainingTimes[poll.id] = `${hours} hour${hours !== 1 ? "s" : ""} left`;
            } else if (minutes > 0) {
              newRemainingTimes[poll.id] = `${minutes} minute${minutes !== 1 ? "s" : ""} left`;
            } else {
              newRemainingTimes[poll.id] = `${seconds} second${seconds !== 1 ? "s" : ""} left`;
            }
          }
        }
      });

      setExpiredPolls(newExpiredPolls);
      setRemainingTimes(newRemainingTimes);
      setVisiblePolls(updatedVisiblePolls);
    };

    updatePolls();
    const interval = setInterval(updatePolls, 1000);
    return () => clearInterval(interval);
  }, [userPolls]);

  useEffect(() => {
    fetchUserCreatedPolls();
  }, [fetchUserCreatedPolls]);

  const formatRemainingTime = (pollId) => {
    return remainingTimes[pollId] || "Loading...";
  };

  // Navigation handler similar to HomeScreen
  const handlePollPress = (poll) => {
    navigation.navigate("PollDisplay", { poll });
  };

  const renderPollItem = ({ item }) => (
    <TouchableOpacity
      className={`flex-row items-center mt-10 ${
        theme === "dark" ? "bg-[#262626]" : "bg-white"
      } rounded-lg p-4 mb-2.5 border border-[#ccc]`}
      onPress={() => handlePollPress(item)} // Updated to pass the full poll object
    >
      <View className="flex-1">
        <Text
          className={`text-[16px] font-semibold ${
            theme === "dark" ? "text-white" : "text-[#333]"
          } mb-1`}
        >
          {item.title || "Untitled Poll"}
        </Text>
        <View className="flex-row items-center mb-1">
          <Text
            className={`text-[14px] ${theme === "dark" ? "text-[#AAA]" : "text-[#555]"} mr-1`}
          >
            Poll Link:
          </Text>
          <TouchableOpacity onPress={() => copyToClipboard(item.link)}>
            <Icon name="content-copy" size={20} color="#007BFF" />
          </TouchableOpacity>
        </View>
        <Text
          className={`text-[14px] ${theme === "dark" ? "text-[#888]" : "text-[#888]"}`}
        >
          {expiredPolls[item.id] ? "Expired" : formatRemainingTime(item.id)}
        </Text>
      </View>
      <Icon
        name="chevron-right"
        size={20}
        color={theme === "dark" ? "#666" : "#CCCCCC"}
      />
    </TouchableOpacity>
  );

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    console.log("Copied to clipboard:", text);
  };

  // if (!user) {
  //   return (
  //     <View
  //       className={`flex-1 justify-center items-center ${
  //         theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"
  //       }`}
  //     >
  //       <Icon
  //         name="account-off-outline"
  //         size={80}
  //         color={theme === "dark" ? "#888" : "#ccc"}
  //       />
  //       <Text
  //         className={`text-[18px] tracking-wide ${
  //           theme === "dark" ? "text-[#AAA]" : "text-[#555]"
  //         } text-center mt-5`}
  //         style={{ fontFamily: "Raleway-Bold" }}
  //       >
  //         Please log in to view your public polls.
  //       </Text>
  //     </View>
  //   );
  // }

  return (
    <View
      className={`flex-1 px-2.5 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"}`}
    >
      {visiblePolls.length > 0 ? (
        <FlatList
          data={visiblePolls}
          renderItem={renderPollItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={refreshing}
          onRefresh={fetchUserCreatedPolls}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Icon
            name="checkbox-blank-off-outline"
            size={50}
            color={theme === "dark" ? "#888" : "#ccc"}
          />
          <Text
            className={`text-[15px] tracking-wide ${
              theme === "dark" ? "text-[#AAA]" : "text-[#555]"
            } text-center mt-5`}
            style={{ fontFamily: "Raleway-Bold" }}
          >
            You haven't created any public polls yet.
          </Text>
        </View>
      )}
    </View>
  );
};

export default MyPublicPolls;