import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  TouchableHighlight,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as SplashScreen from "expo-splash-screen";
import * as Clipboard from "expo-clipboard";
import DeletePollModal from "../src/components/deletemodal";
import QRCodeScannerModal from "../src/components/QRCodeScannerModal";
import useVoteData from "../src/utils/usevotedata";
import { showToast } from "../src/utils/toastconfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../src/components/ThemeContext";
import { Menu, MenuItem } from "react-native-material-menu";
import { getApiUrl } from "../apiConfig";
import useFetchUserAndPolls from "../src/utils/userandpolls";

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
  const { user } = useFetchUserAndPolls();
  const {
    selectedOption,
    voteResults,
    totalVotes,
    handleVote,
    votingDisabled,
  } = useVoteData(poll.id, showToast);
  const [isExpired, setIsExpired] = useState(false);
  const [remainingTime, setRemainingTime] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [isFetchingQr, setIsFetchingQr] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [appIsReady, setAppIsReady] = useState(false);

  const isCreator = useMemo(() => {
    if (!user || !poll) return false;
    const isCreatorResult = poll.isCreatedByMe || poll.user?.id === user.id;
    console.log("isCreator calculation:", {
      isCreatedByMe: poll.isCreatedByMe,
      pollUserId: poll.user?.id,
      userId: user.id,
      isCreatorResult,
    });
    return isCreatorResult;
  }, [user, poll]);

  const fetchQrCode = async () => {
    try {
      setIsFetchingQr(true);
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        showToast("error", "Please log in again");
        return;
      }

      const response = await fetch(getApiUrl(`polls/${poll.id}/qrcode`), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.qr_code) {
        setQrCodeImage(data.qr_code);
        console.log("QR code fetched successfully:", data.qr_code);
      } else {
        throw new Error(data.error || "Failed to load QR code");
      }
    } catch (error) {
      console.error("QR code fetch error:", error);
      showToast("error", `Error fetching QR code: ${error.message}`);
    } finally {
      setIsFetchingQr(false);
    }
  };

  const handleScan = async (pollId) => {
    try {
      console.log("Scanned poll ID:", pollId);
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const apiUrl = getApiUrl(`polls/${pollId}`);
      console.log("Fetching poll from:", apiUrl);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Poll fetch status:", response.status);
      const data = await response.json();
      console.log("Poll fetch response:", data);

      if (response.ok && data.success) {
        console.log("Navigating to PollDisplay with poll:", data.poll);
        navigation.navigate("PollDisplay", { poll: data.poll });
        setScannerVisible(false);
      } else {
        throw new Error(data.error || "Failed to load poll");
      }
    } catch (error) {
      console.error("Poll fetch error:", error);
      Alert.alert("Error", `Failed to load poll: ${error.message}`);
    }
  };

  const handleDeletePress = () => {
    setDeleteModalVisible(true);
    setMenuVisible(false);
  };

  const handleMenuClose = () => {
    setMenuVisible(false);
  };

  const isPollExpired = (pollData) => {
    if (!pollData.duration) return false; // No duration means never expires
    const now = new Date();
    const expirationTime =
      new Date(pollData.created_at).getTime() + pollData.duration * 60 * 1000;
    return now.getTime() > expirationTime;
  };

  const getExpirationTime = (pollData) => {
    if (!pollData.duration) return null;
    return new Date(pollData.created_at).getTime() + pollData.duration * 60_000;
  };

  const getRemainingTime = (expirationTime, pollData) => {
    if (!pollData.duration) return "Ongoing";
    if (!expirationTime) return "Expired";

    const now = Date.now();
    const timeDiff = expirationTime - now;

    if (timeDiff <= 0) return "Expired";
    const millisecondsInMinute = 60_000;
    const millisecondsInHour = 3_600_000;
    const millisecondsInDay = 86_400_000;
    const days = Math.floor(timeDiff / millisecondsInDay);
    const hours = Math.floor(
      (timeDiff % millisecondsInDay) / millisecondsInHour
    );
    const minutes = Math.floor(
      (timeDiff % millisecondsInHour) / millisecondsInMinute
    );

    let result = "";
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
      showToast("error", "No link available to copy");
      console.error("No link available to copy");
    }
  };

  const formatCreatedDate = (createdAt) => {
    if (!createdAt) return "Unknown date";
    const date = new Date(createdAt);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const createdDate = formatCreatedDate(poll.created_at);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn("Splash screen error:", e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    console.log('Poll data:', poll);
    const expirationTime = getExpirationTime(poll);
    const updateExpiration = () => {
      setIsExpired(isPollExpired(poll));
      setRemainingTime(getRemainingTime(expirationTime, poll));
    };
    updateExpiration();
    const interval = setInterval(updateExpiration, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: theme === "dark" ? "#1A1A1A" : "#F5F5F7",
        elevation: theme === "dark" ? 2 : 1,
        shadowOpacity: theme === "dark" ? 4 : 2,
      },
      headerTitle: "",
      headerTintColor: theme === "dark" ? "#60B8FF" : "#50A8EE",
      headerTitleStyle: {
        fontFamily: "Raleway-Bold",
        fontSize: 20,
        letterSpacing: 0.5,
        color: theme === "dark" ? "#FFFFFF" : "#50A8EE",
      },
      headerLeft: () => (
        <TouchableHighlight
          underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
          onPress={() => navigation.navigate("HomeScreen")}
          style={{
            padding: 10,
            borderRadius: 9999,
            marginTop: 2,
            marginLeft: 8,
          }}
        >
          <Icon
            name="arrow-left"
            size={20}
            color={theme === "dark" ? "#FFFFFF" : "#000000"}
          />
        </TouchableHighlight>
      ),
      headerRight: () =>
        isCreator && (
          <TouchableHighlight
            underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
            onPress={() => setMenuVisible(true)}
            style={{
              padding: 10,
              borderRadius: 9999,
              marginTop: 2,
              marginRight: 8,
            }}
          >
            <Icon
              name="dots-vertical"
              size={20}
              color={theme === "dark" ? "#FFFFFF" : "#000000"}
            />
          </TouchableHighlight>
        ),
    });
  }, [navigation, theme, isCreator]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme === "dark" ? "#1A1A1A" : "#F5F5F7",
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 10,
          paddingBottom: 20,
          paddingTop: 10,
        }}
      >
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
              <Text
                className={`text-[16px] tracking-wide ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {isCreator ? "By Me" : poll.user?.username || "Unknown"}
              </Text>
              <Text
                className={`text-[11px] tracking-normal ${
                  theme === "dark" ? "text-[#ccc]" : "text-[#555]"
                }`}
              >
                {poll.duration
                  ? isExpired
                    ? "Expired"
                    : `${remainingTime} left`
                  : "Ongoing"}
              </Text>
            </View>
          </View>
        </View>

        <Text
          className={`text-[22px] tracking-wide mt-5 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          {poll.title || "Untitled Poll"}
        </Text>
        <Text
          className={`text-[15px] tracking-wide mt-1 mb-4 ${
            theme === "dark" ? "text-[#ccc]" : "text-[#555]"
          }`}
        >
          {poll.description ? (
            poll.description
          ) : (
            <Text className="italic">No description</Text>
          )}
        </Text>

        <FlatList
          data={poll.choices}
          keyExtractor={(choice) => choice.id.toString()}
          renderItem={({ item }) => {
            const votePercentage =
              voteResults.find((result) => result.option_id === item.id)
                ?.percentage || 0;
            const isSelected = selectedOption === item.id;
            return (
              <TouchableOpacity
                className={`relative border rounded-[10px] h-[60px] my-1 overflow-hidden ${
                  isSelected
                    ? theme === "dark"
                      ? "border-[#60B8FF]"
                      : "border-[#50A8EE]"
                    : theme === "dark"
                    ? "border-[#fff]"
                    : "border-[#ccc]"
                } ${(votingDisabled || isExpired) && "opacity-50"}`}
                onPress={() => handleVote(item.id)}
                disabled={votingDisabled || (isExpired && poll.duration)}
              >
                <View
                  className="absolute inset-0"
                  style={{
                    width: `${votePercentage}%`,
                    backgroundColor: isSelected
                      ? theme === "dark"
                        ? "rgba(96, 184, 255, 0.3)"
                        : "rgba(80, 168, 238, 0.3)"
                      : theme === "dark"
                      ? "rgba(170, 170, 170, 0.3)"
                      : "rgba(204, 204, 204, 0.3)",
                  }}
                />
                <View className="flex-row justify-between items-center px-2.5 py-5 z-10">
                  <Text
                    className={`flex-1 text-[14px] tracking-wide ${
                      isSelected
                        ? theme === "dark"
                          ? "text-[#60B8FF]"
                          : "text-[#50A8EE]"
                        : theme === "dark"
                        ? "text-[#fff]"
                        : "text-[#555]"
                    }`}
                  >
                    {item.option_text}
                  </Text>
                  <Text
                    className={`text-[14px] tracking-tight px-2.5 ${
                      isSelected
                        ? theme === "dark"
                          ? "text-[#60B8FF]"
                          : "text-[#50A8EE]"
                        : theme === "dark"
                        ? "text-[#fff]"
                        : "text-[#555]"
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

        <View className="mt-4 px-1">
          <View
            className={`flex-row items-center gap-2 border-b mb-5 pb-3 ${
              theme === "dark" ? "border-[#fff]" : "border-[#ccc]"
            }`}
          >
            <Text
              className={`text-[12px] tracking-normal ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              {poll.timeAgo}
            </Text>
            <Icon
              name="circle"
              size={5}
              color={theme === "dark" ? "#ccc" : "#555"}
            />
            <Text
              className={`text-[12px] tracking-normal ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
            >
              {createdDate}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Icon
                name="poll"
                size={19}
                color={theme === "dark" ? "#ccc" : "#555"}
                className="mr-1.5"
              />
              <Text
                className={`text-[13px] tracking-wide ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
              >
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(true);
                  setQrCodeImage(null);
                }}
                disabled={isFetchingQr}
              >
                <Icon
                  name="share"
                  size={22}
                  color={theme === "dark" ? "#ccc" : "#555"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
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
          <View
            className={`flex-1 justify-end ${
              theme === "dark" ? "bg-black/50" : "bg-black/50"
            }`}
          >
            <View
              className={`rounded-t-3xl p-5 ${
                theme === "dark" ? "bg-[#2A2A2A]" : "bg-white"
              }`}
            >
              {isFetchingQr && (
                <Text
                  className={`text-[14px] tracking-wide text-center ${
                    theme === "dark" ? "text-white" : "text-black"
                  }`}
                >
                  Loading QR code...
                </Text>
              )}
              {!isFetchingQr && !qrCodeImage && (
                <>
                  {poll.link && (
                    <TouchableOpacity
                      className="flex-row items-center py-4"
                      onPress={handleCopyLink}
                    >
                      <Icon
                        name="link"
                        size={20}
                        color={theme === "dark" ? "#fff" : "black"}
                        className="mr-3"
                      />
                      <Text
                        className={`text-[14px] tracking-wide ${
                          theme === "dark" ? "text-white" : "text-black"
                        }`}
                        style={{ fontFamily: "OpenSans-Medium" }}
                      >
                        Copy link
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    className="flex-row items-center py-4"
                    onPress={fetchQrCode}
                    disabled={isFetchingQr}
                  >
                    <Icon
                      name="qrcode"
                      size={20}
                      color={theme === "dark" ? "#fff" : "black"}
                      className="mr-3"
                    />
                    <Text
                      className={`text-[14px] tracking-wide ${
                        theme === "dark" ? "text-white" : "text-black"
                      }`}
                      style={{ fontFamily: "OpenSans-Medium" }}
                    >
                      Show QR Code
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {!isFetchingQr && qrCodeImage && (
                <View className="items-center py-4">
                  <Image
                    source={{ uri: qrCodeImage }}
                    style={{ width: 200, height: 200 }}
                    onError={(e) => {
                      console.error(
                        "QR code image load error:",
                        e.nativeEvent.error
                      );
                      showToast("error", "Failed to load QR code image");
                      setQrCodeImage(null);
                    }}
                    onLoad={() =>
                      console.log("QR code image loaded successfully")
                    }
                  />
                  <TouchableOpacity
                    className="mt-4"
                    onPress={() => setQrCodeImage(null)}
                  >
                    <Text
                      className={`text-[14px] tracking-wide ${
                        theme === "dark" ? "text-white" : "text-black"
                      }`}
                      style={{ fontFamily: "OpenSans-Medium" }}
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
                  setQrCodeImage(null);
                }}
              >
                <Text
                  className="text-white text-[14px] tracking-wider"
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        transparent={true}
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => setScannerVisible(false)}
      >
        <QRCodeScannerModal
          onScan={handleScan}
          onClose={() => setScannerVisible(false)}
          theme={theme}
        />
      </Modal>

      {menuVisible && (
        <TouchableWithoutFeedback onPress={handleMenuClose}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <View
              style={{
                position: "absolute",
                right: 10,
                top: 50,
              }}
            >
              <Menu
                visible={menuVisible}
                anchor={<View />}
                onRequestClose={handleMenuClose}
                style={{
                  backgroundColor: theme === "dark" ? "#2A2A2A" : "#FFFFFF",
                  width: 150,
                }}
              >
                {isCreator && (
                  <MenuItem
                    onPress={handleDeletePress}
                    textStyle={{
                      color: "#FF5555",
                      fontFamily: "OpenSans-Regular",
                    }}
                  >
                    Delete
                  </MenuItem>
                )}
                {isCreator && (
                  <MenuItem
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate("EditPoll", { pollData: poll });
                    }}
                    textStyle={{
                      color: theme === "dark" ? "#FFFFFF" : "#000000",
                      fontFamily: "OpenSans-Regular",
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
    </SafeAreaView>
  );
};

export default PollDisplay;