import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as SplashScreen from "expo-splash-screen";
import { TextInput } from "react-native-gesture-handler";
import * as Clipboard from "expo-clipboard";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";

import useLoadFonts from '../src/hooks/useLoadFonts';
import { ThemeContext } from '../src/components/ThemeContext';


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
  if (!loaded && !fonterror) return null;

  useEffect(() => {
    if (!poll || !poll.expirationTime) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expirationTime = new Date(poll.expirationTime).getTime();
      const remainingTime = expirationTime - now;

      if (remainingTime <= 0) {
        setCountdown("00:00:00");
        return;
      }

      const hours = Math.floor(remainingTime / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      setCountdown(
        `${hours}h ${minutes}m ${seconds}s`
      );
    };

    updateCountdown(); // Initial call
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [poll]);




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

  const handlePollPress = () => {
    if (poll) {
      navigation.navigate("PollDisplay", { poll });
    }
  };
  

  const showToast = (type, message) => {
    console.log(`${type}: ${message}`);
  };

  const handleJoinPoll = async () => {
    setLoading(true);
    setError(false);
    setWarning(false);
    setPoll(null);

    console.log("Searching for link:", link);

    try {
      const API_URL = "http://192.168.169.150:8000/api/search-by-link";
      const response = await axios.post(API_URL, { link });

      console.log("Search response:", response.data);

      if (response.data.success) {
        const fetchedPoll = response.data.poll;
        const formattedPoll = {
          ...fetchedPoll,
          timeAgo: moment(fetchedPoll.created_at).fromNow(),
          isCreatedByMe: user && fetchedPoll.user?.id === user.id,
          totalVotes: fetchedPoll.total_votes || 0,
          duration: fetchedPoll.duration || 60,
          expirationTime: new Date(new Date(fetchedPoll.created_at).getTime() + (fetchedPoll.duration || 60) * 60_000),
          isExpired: fetchedPoll.is_expired,
        };
        setPoll(formattedPoll);
        showToast("success", "Poll found successfully!");
      } else {
        const errorMessage = response.data.message || "Invalid poll link";
        if (errorMessage === "Private poll link not found or has expired") {
          setWarning(true);
        } else {
          setError(true);
        }
        showToast("error", errorMessage);
      }
    } catch (error) {
      console.error("Search Error:", error.message);
      console.error("Error response:", error.response?.data);
  
      const errorMessage = error.response?.data?.message || "An error occurred";
  
      if (errorMessage.includes("expired") || errorMessage.includes("not found")) {
        setWarning(true);
      } else {
        setError(true);
      }
  
      alert("Not Found or Expired", errorMessage);  // ✅ Always show an error toast
    } finally {
      setLoading(false);
    }
  };

  const clearLink = () => setLink("");

  const copyToClipboard = async () => {
    if (poll?.link) {
      await Clipboard.setStringAsync(poll.link);
      showToast("success", "Link copied to clipboard!");
    }
  };


  return (
    <ScrollView className={`flex-grow ${
      theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"
    }`}>
      <View className="flex-1 px-2.5  h-full">
        <View className="pt-5 pb-4 items-center">
          <View className="flex-row items-center rounded-lg border border-[#E6E6E6] px-2.5">
            <TextInput
              className={`flex-1 h-[45px] px-3 text-black text-[12px] tracking-wide ${error ? 'border-[#FF4D4D]' : warning ? 'border-[#FFC107]' : ''}`}
              autoCorrect={false}
              autoCapitalize="none"
              value={link}
              onChangeText={setLink}
              placeholder="Enter link"
              placeholderTextColor="#444"
              style={{ fontFamily: 'OpenSans-Medium'}} 
            />
            <TouchableOpacity className="p-1.5" onPress={clearLink}>
              <Icon name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className={`w-full p-3 rounded-xl items-center bg-[#50A8EE] mb-4 mt-3 ${loading || !link.trim() ? '' : ''}`}
            onPress={handleJoinPoll}
            disabled={loading || !link.trim()}
            
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white text-[15px] tracking-wider" style={{ fontFamily: 'OpenSans-Regular'}}>
                Join
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {poll && (
          <TouchableOpacity
            onPress={handlePollPress}
            className="p-4 mb-2.5 rounded-lg bg-white shadow-md"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row justify-between flex-1">
                <Text className="text-xs text-[#444] tracking-tight" style={{ fontFamily: 'Inter-Regular' }}>
                  By {poll.isCreatedByMe ? "Me" : poll.user?.username || "Unknown"}
                </Text>
              </View>
              <Icon name="lock-outline" size={20} color="#50A8EE" />
            </View>
            <Text className="text-[11px] text-[#555] tracking-tight mt-1" style={{ fontFamily: 'Inter-Medium' }}>
              {poll.timeAgo}
            </Text>
            <View className="mb-2.5">
              <Text className="text-xl mb-4" style={{ fontFamily: 'Inter-Semibold' }}>
                {poll.title || "Private Poll"}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Text className="text-[11px] text-[#50A8EE] tracking-tight" style={{ fontFamily: 'Inter-Medium' }}>
                  votes
                </Text>
                <Icon name="bookmark-outline" size={15} color="#555" className="mx-1.5" />
                <Icon name="comment-outline" size={14.5} color="#555" className="mx-1.5" />
              </View>
              <Text
                className={`text-[11px] tracking-tight ${poll.isExpired ? 'text-[#FF3B30]' : 'text-[#555]'}`}
                style={{ fontFamily: 'Inter-Medium' }}
              >
                {poll.isExpired ? "(Expired)" : countdown}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};




export default PrivatePoll;