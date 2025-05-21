import React, { useState, useEffect, useContext } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Clipboard, 
  ScrollView, 
  Modal, 
  TouchableWithoutFeedback, 
  TouchableHighlight,
} from "react-native";
import { useRoute} from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; 
import * as SplashScreen from 'expo-splash-screen';
import CommentSection from "../src/components/commentsection";
import DeletePollModal from "../src/components/deletemodal";
import useVoteData from "../src/utils/usevotedata"; 
import { showToast } from "../src/utils/toastconfig";
import { useBookmark } from "../src/utils/usebookmark";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from '../src/components/ThemeContext';
import { Menu, MenuItem } from 'react-native-material-menu';
SplashScreen.preventAutoHideAsync();

const avatarMap = {
  "default-avatar.webp": require("../assets/images/default-avatar.webp"),
  "female-avatar.jpg": require("../assets/images/female-avatar.jpg"),
  "male-avatar.png": require("../assets/images/male-avatar.png"),
};
const PollDisplay = ({ navigation }) => {
  const route = useRoute();
  const { poll } = route.params;
  const { theme } = useContext(ThemeContext); 
  const { 
    bookmarked, 
    toggleBookmark, 
    loading,  
  } = useBookmark(poll);
  const { 
      selectedOption, 
      showPercentage, 
      voteResults, 
      totalVotes, 
      handleVote, 
      votingDisabled,
    } = useVoteData(poll.id);
  const [isExpired, setIsExpired] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [isFetchingQr, setIsFetchingQr] = useState(false); 
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchQrCode = async () => {
      try {
        console.log("Starting fetchQrCode for poll ID:", poll.id);
        const token = await AsyncStorage.getItem("auth_token");
        console.log("Token:", token);
        const response = await fetch(
          `http://192.168.169.150:8000/api/polls/${poll.id}/qrcode`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        const data = await response.json();
        console.log("Response:", data);
        if (data.success) {
          console.log("Success! Setting QR code:", data.qr_code.substring(0, 50) + "...");
          setQrCodeImage(data.qr_code);
        } else {
          console.log("Failed response:", data);
          showToast("error", data.error || "Failed to load QR code");
        }
      } catch (error) {
        console.log("Fetch error:", error.message);
        showToast("error", "Error fetching QR code: " + error.message);
      }
  };
  
  const handleBookmarkPress = async () => {
    await toggleBookmark();
  };
  
  const handleDeletePress = () => {
    console.log("Delete button pressed for poll ID:", poll.id);
    setDeleteModalVisible(true); 
    setMenuVisible(false);
  };

  const handleMenuClose = () => {
    setMenuVisible(false); 
  };

  const isPollExpired = (pollData) => {
    const now = new Date();
    const expirationTime = new Date(pollData.created_at).getTime() + pollData.duration * 60 * 1000;
    return now.getTime() > expirationTime;
  };
    
  const getExpirationTime = (pollData) => {
    return new Date(pollData.created_at).getTime() + pollData.duration * 60_000;
  };
    
  const getRemainingTime = (expirationTime) => {
    const now = Date.now();
    const timeDiff = expirationTime - now;
    
    if (timeDiff <= 0) return "Expired";
    const millisecondsInMinute = 60_000;
    const millisecondsInHour = 3_600_000;
    const millisecondsInDay = 86_400_000;
    const days = Math.floor(timeDiff / millisecondsInDay);
    const hours = Math.floor((timeDiff % millisecondsInDay) / millisecondsInHour);
    const minutes = Math.floor((timeDiff % millisecondsInHour) / millisecondsInMinute);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    result += `${minutes}m`;
    
    return result.trim();
  };
  
  const handleCopyLink = () => {
    if (poll.link) {
      Clipboard.setString(poll.link);
      showToast("success", "Link copied to clipboard!");
      setModalVisible(false);
    } else {
      showToast("error", "No link available to copy.");
    }
  };

  const formatCreatedDate = (createdAt) => {
    if (!createdAt) return 'Unknown date';
      const date = new Date(createdAt);
      return date.toLocaleDateString('en-US', {
        month: 'long', // e.g., "March"
        day: 'numeric', // e.g., "26"
        year: 'numeric', // e.g., "2025"
    });
  };

  const createdDate = formatCreatedDate(poll.created_at);

  useEffect(() => {
    const expirationTime = getExpirationTime(poll);
    const updateExpiration = () => {
      setIsExpired(isPollExpired(poll));
      setRemainingTime(getRemainingTime(expirationTime));
    };
    updateExpiration(); 
      const interval = setInterval(updateExpiration, 1000); 
      return () => clearInterval(interval);
    }, [poll]);
  
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme === "dark" ? "#1A1A1A" : "#FFFFFF",
        height: 55,
        elevation: theme === "dark" ? 2 : 1,
        shadowOpacity: theme === "dark" ? 4 : 2,
      },
      headerTitle: "",
      headerTintColor: theme === 'dark' ? '#60B8FF' : '#50A8EE', 
      headerTitleStyle: {
        fontFamily: 'Raleway-Bold', 
        fontSize: 20,
        letterSpacing: 0.5,
        color: theme === 'dark' ? '#FFFFFF' : '#50A8EE',
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
      headerRight: () => (
        poll.isCreatedByMe && (
          <TouchableHighlight
          underlayColor={theme === 'dark' ? '#333333' : '#e5e5e5'}
          onPress={() => setMenuVisible(true)}
          className="px-2.5 rounded-full mt-1 mr-2"
        >
          <Icon name="dots-vertical" size={20} color={theme === 'dark' ? '#FFFFFF' : '#000000'} />
        </TouchableHighlight>
        )
        ),
      });
  }, [navigation]);
  
    console.log("fetch []", poll.isCreatedByMe);
  return (
    <>
      <ScrollView className={`flex-1  ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-[#FFFFFF]' }`} contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}>
        <View className="flex-row justify-between items-center mt-5">
          <View className="flex-row items-center">
            <Image
              source={
                poll.user?.avatar && avatarMap[poll.user.avatar]
                  ? avatarMap[poll.user.avatar]
                  : avatarMap["default-avatar.webp"]
              }
              className="w-[70px] h-[70px] rounded-full mr-2 border-2 border-[#50A8EE]"
            />
            <View>
              <Text className={`text-[16px] tracking-wide ${
                theme === 'dark' ? 'text-white' : 'text-black '
              }`}>
                {poll.user?.username}
              </Text>
              <Text className={`text-[11px] tracking-normal ${
                theme === 'dark'? 'text-[#ccc]' : 'text-[#555]'
              }`}>
                {isExpired ? "Expired" : `${remainingTime}`} left
              </Text>
             
            </View>
          </View>
        </View>

        <Text className={`text-[22px] tracking-wide mt-5 ${
          theme === 'dark' ? 'text-white' : 'text-black'
        }`}>
          {poll.title}
        </Text>
        <Text className={`text-[15px]  tracking-wide mt-1 mb-4 ${
          theme === 'dark' ? 'text-[#ccc]' : 'text-[#555]'
        }`}>
          {poll.description ? poll.description : <Text className="italic">No description</Text>}
        </Text>

        <FlatList
          data={poll.choices}
          keyExtractor={(choice) => choice.id.toString()}
          renderItem={({ item }) => {
            const votePercentage = voteResults.find((result) => result.option_id === item.id)?.percentage || 0;
            const isSelected = selectedOption === item.id;
            return (
              <TouchableOpacity
                className={`relative border rounded-[10px] h-[60px] my-1 overflow-hidden ${
                  isSelected
                    ? theme === 'dark'
                      ? 'border-[#60B8FF]' 
                      : 'border-[#50A8EE]' 
                    : theme === 'dark'
                    ? 'border-[#fff]' 
                    : 'border-[#ccc]' 
                } ${(votingDisabled || isExpired) && 'opacity-50'}`}
                onPress={() => handleVote(item.id)}
                disabled={votingDisabled || isExpired}
              >
                <View
                  className="absolute inset-0"
                  style={{
                    width: `${votePercentage}%`,
                    backgroundColor: isSelected
                      ? theme === 'dark'
                        ? 'rgba(96, 184, 255, 0.3)'
                        : 'rgba(80, 168, 238, 0.3)' 
                      : theme === 'dark'
                      ? 'rgba(170, 170, 170, 0.3)' 
                      : 'rgba(204, 204, 204, 0.3)', 
                  }}
                />
                <View className="flex-row justify-between items-center px-2.5 py-5 z-10">
                  <Text
                    className={`flex-1 text-[14px] tracking-wide ${
                      isSelected
                        ? theme === 'dark'
                          ? 'text-[#60B8FF]' // Brighter blue for dark mode
                          : 'text-[#50A8EE]' // Blue for light mode
                        : theme === 'dark'
                        ? 'text-[#fff]' // Light gray for dark mode
                        : 'text-[#555]' // Dark gray for light mode
                    }`}
                  >
                    {item.option_text}
                  </Text>
                  <Text
                    className={`text-[14px] tracking-tight px-2.5 ${
                      isSelected
                        ? theme === 'dark'
                          ? 'text-[#60B8FF]' // Brighter blue for dark mode
                          : 'text-[#50A8EE]' // Blue for light mode
                        : theme === 'dark'
                        ? 'text-[#fff]' // Light gray for dark mode
                        : 'text-[#555]' // Dark gray for light mode
                    }`}
                  >
                    {votePercentage}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          scrollEnabled={false}
        />

        {/* Poll Metadata Section */}
        <View className="mt-4 px-1">
          <View className={`flex-row items-center gap-2 border-b mb-5 pb-3 ${
            theme === 'dark' ? 'border-[#fff]' : 'border-[#ccc]'
          }`}>
            <Text className={`text-[12px] tracking-normal ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
               {poll.timeAgo}
            </Text>
            <Icon name="circle" size={5} color={theme === 'dark' ? '#ccc' : '#555'}/>
            <Text  className={`text-[12px] tracking-normal ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              {createdDate}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
                <Icon name="poll" size={19} color={theme === 'dark' ? '#ccc' : '#555'} className="mr-1.5" />
                <Text className={`text-[13px] tracking-wide ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                </Text>
            </View>
            <View className="flex-row items-center gap-4">
                <View className="flex-row items-center">
                    {/* <Icon name="comment-text-outline" size={19} color="#555" className="mr-1" />
                    <Text className="text-[13px] text-[#555]  tracking-tight">
                        {poll.comments || 0}
                    </Text> */}
                    <CommentSection pollId={poll.id} />
                </View>
                <View className="flex-row items-center">
                <TouchableOpacity 
                    onPress={handleBookmarkPress} 
                    disabled={loading}
                    className="flex-row items-center"
                  >
                    <Icon 
                      name={bookmarked ? "bookmark" : "bookmark-outline"} 
                      size={19} 
                      color={bookmarked ? '#50A8EE' : theme === 'dark' ? '#ccc' : '#555'} 
                      className="mr-1" 
                    />
                    {/* <Text className={`text-[13px] tracking-wide ${theme === 'dark' ? 'text-[#ccc]' : 'text-[#555]'}`}>
                      {bookmarkCounts[poll.id] || 0}
                    </Text> */}
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center"> 
                    <TouchableOpacity
                      onPress={() => {
                        console.log("Share icon pressed");
                        setModalVisible(true);
                        setQrCodeImage(null);
                      }}
                      disabled={isFetchingQr}
                    >
                        <Icon name="share" size={22} color={theme === 'dark' ? '#ccc' : '#555'} />
                    </TouchableOpacity>

                    <Modal
                    transparent={true}
                    visible={modalVisible}
                    animationType="none"
                    onRequestClose={() => {
                      setModalVisible(false);
                      setQrCodeImage(null); 
                    }}
                  >
                    <TouchableWithoutFeedback
                      onPress={() => {
                        setModalVisible(false);
                        setQrCodeImage(null); 
                      }}
                    >
                      <View className={`flex-1 justify-end ${theme === 'dark' ? 'bg-black/50' : 'bg-black/50'}`}>
                        <View className={`rounded-t-3xl p-5 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-white'}`}>
                          {isFetchingQr && (
                            <Text className={`text-[14px] tracking-wide ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                              Loading QR code...
                            </Text>
                          )}
                          {!isFetchingQr && !qrCodeImage && (
                            <>
                              {poll.link && (
                                <TouchableOpacity className="flex-row items-center py-4" onPress={handleCopyLink}>
                                  <Icon name="link" size={20} color={theme === 'dark' ? '#fff' : 'black'} className="mr-3" />
                                  <Text
                                    className={`text-[14px] tracking-wide ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                                    style={{ fontFamily: 'OpenSans-Medium' }}
                                  >
                                    Copy link
                                  </Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                className="flex-row items-center py-4"
                                onPress={() => fetchQrCode()}
                                disabled={isFetchingQr}
                              >
                                <Icon name="qrcode" size={20} color={theme === 'dark' ? '#fff' : 'black'} className="mr-3" />
                                <Text
                                  className={`text-[14px] tracking-wide ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                                  style={{ fontFamily: 'OpenSans-Medium' }}
                                >
                                  Show QR Code
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {!isFetchingQr && qrCodeImage && (
                            <View className="items-center py-4">
                              <Image source={{ uri: qrCodeImage }} style={{ width: 200, height: 200 }} />
                              <TouchableOpacity className="mt-4" onPress={() => setQrCodeImage(null)}>
                                <Text
                                  className={`text-[14px] tracking-wide ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                                  style={{ fontFamily: 'OpenSans-Medium' }}
                                >
                                  Back
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                          <TouchableOpacity
                            className="mt-4 bg-[#50A8EE] rounded-xl p-3 items-center"
                            onPress={() => {
                              setModalVisible(false);
                              setQrCodeImage(null); // Reset QR code on cancel
                            }}
                          >
                            <Text
                              className="text-white text-[14px] tracking-wider"
                              style={{ fontFamily: 'OpenSans-Regular' }}
                            >
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                    </Modal>    
                </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {menuVisible && (
        <TouchableWithoutFeedback onPress={handleMenuClose}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <View
              style={{
                position: 'absolute',
                right: 10,
                top: 5,  
              }}
            >
              <Menu
                visible={menuVisible}
                anchor={<View />} 
                onRequestClose={handleMenuClose}
                style={{
                  backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFFFFF',
                  width: 150, 
                }}
              >
                {poll.isCreatedByMe && (
                  <MenuItem
                    onPress={handleDeletePress}
                    textStyle={{
                      color: theme === 'dark' ? '#FF5555' : '#FF5555',
                      fontFamily: 'OpenSans-Regular',
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
                {poll.isCreatedByMe && (
                  <MenuItem
                    onPress={() => {
                      setMenuVisible(false);
                      console.log('Edit pressed');
                    }}
                    textStyle={{
                      color: theme === 'dark' ? '#FFFFFF' : '#000000',
                      fontFamily: 'OpenSans-Regular',
                    }}
                  >
                    Edit
                  </MenuItem>
                )}
              </Menu>
            </View>
          </View>
        </TouchableWithoutFeedback>
      )}
      <DeletePollModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        pollId={poll.id}
        navigation={navigation}
        theme={theme}
      />
    </>
  );

};
  
 

  export default PollDisplay;
