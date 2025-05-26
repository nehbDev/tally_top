import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TouchableHighlight,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { ScrollView } from "react-native-gesture-handler";
import axios from "axios";
import useLoadFonts from "../src/hooks/useLoadFonts";
import { ThemeContext } from "../src/components/ThemeContext";
import LogoutModal from "../src/components/logoutmodal";

SplashScreen.preventAutoHideAsync();

const avatarMap = {
  "default-avatar.webp": require("../assets/images/default-avatar.webp"),
  "female-avatar.jpg": require("../assets/images/female-avatar.jpg"),
  "male-avatar.png": require("../assets/images/male-avatar.png"),
};

const ProfilePage = ({ navigation }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [editProfileExpanded, setEditProfileExpanded] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { loaded, fonterror } = useLoadFonts();

  if (!loaded && !fonterror) return null;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          const response = await axios.get("http://192.168.1.21:8000/api/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Fetched user from API:", response.data);
          setUser(response.data);
          await AsyncStorage.setItem("user", JSON.stringify(response.data));
        } else {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log("Loaded user from AsyncStorage:", parsedUser);
            setUser(parsedUser);
          } else {
            console.warn("No user found in AsyncStorage");
            setUser({ username: "Guest User", avatar: "default-avatar.webp" });
          }
        }
      } catch (error) {
        console.error("Error loading user:", error.response ? error.response.data : error.message);
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } else {
          setUser({ username: "Guest User", avatar: "default-avatar.webp" });
        }
      }
    };

    loadUser();

    const unsubscribe = navigation.addListener("focus", loadUser);
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    console.log("Initiating logout...");
    setLogoutModalVisible(false);
    navigation.navigate("LogoutScreen", { user, theme });
  };

  return (
    <View
      className={`flex-1 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"}`}
    >
      <View
        className={`items-center justify-center ${theme === "dark" ? "bg-[#262626]" : "bg-[#e2ebf1]"}`}
      >
        <View className="items-center p-5">
          <Image
            source={
              user?.avatar && avatarMap[user.avatar]
                ? avatarMap[user.avatar]
                : require("../assets/images/default-avatar.webp")
            }
            className="w-[80px] h-[80px] mb-1 rounded-full border-2 border-[#50A8EE]"
          />
          <Text
            className={`text-[15px] ${theme === "dark" ? "text-white" : "text-black"} mb-1 tracking-wide`}
            style={{ fontFamily: "OpenSans-SemiBold" }}
          >
            {user?.username || "Loading..."}
          </Text>
          <Text
            className={`text-[12px] ${theme === "dark" ? "text-[#AAA]" : "text-[#444]"} tracking-wide`}
            style={{ fontFamily: "OpenSans-Regular" }}
          >
            {user?.email || "Loading..."}
          </Text>
        </View>
      </View>

      <ScrollView className="mt-5 px-2.5">
        <View className="gap-2">
          <TouchableHighlight
            className={`flex-row items-center justify-between ${theme === "dark" ? "bg-[#262626]" : "bg-white"} rounded-xl`}
            underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
            onPress={() => navigation.navigate("MyPublicPolls")}
            style={{
              shadowColor: theme === "dark" ? "#000000" : "#555555",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 1,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center justify-between w-full p-5">
              <View className="flex-row items-center gap-2.5">
                <Icon
                  name="account-group-outline"
                  size={17}
                  color={theme === "dark" ? "white" : "black"}
                />
                <Text
                  className={`text-[13px] ${theme === "dark" ? "text-white" : "text-black"} tracking-wide`}
                  style={{ fontFamily: "OpenSans-SemiBold" }}
                >
                  Public Polls
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={17}
                color={theme === "dark" ? "#666" : "black"}
              />
            </View>
          </TouchableHighlight>

          <TouchableHighlight
            className={`flex-row items-center justify-between ${theme === "dark" ? "bg-[#262626]" : "bg-white"} rounded-xl`}
            underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
            onPress={() => navigation.navigate("MyPrivatePolls")}
            style={{
              shadowColor: theme === "dark" ? "#000000" : "#555555",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 1,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center justify-between w-full p-5">
              <View className="flex-row items-center gap-2.5">
                <Icon
                  name="lock-outline"
                  size={17}
                  color={theme === "dark" ? "white" : "black"}
                />
                <Text
                  className={`text-[13px] ${theme === "dark" ? "text-white" : "text-black"} tracking-wide`}
                  style={{ fontFamily: "OpenSans-SemiBold" }}
                >
                  Private Polls
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={17}
                color={theme === "dark" ? "#666" : "black"}
              />
            </View>
          </TouchableHighlight>

          {/* Edit Profile Expandable Section */}
          <View>
            <TouchableHighlight
              className={`flex-row items-center justify-between ${theme === "dark" ? "bg-[#262626]" : "bg-white"} rounded-xl`}
              underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
              onPress={() => setEditProfileExpanded(!editProfileExpanded)}
              style={{
                shadowColor: theme === "dark" ? "#000000" : "#555555",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 1,
                elevation: 3,
              }}
            >
              <View className="flex-row items-center justify-between w-full p-5">
                <View className="flex-row items-center gap-2.5">
                  <Icon
                    name="account-outline"
                    size={17}
                    color={theme === "dark" ? "white" : "black"}
                  />
                  <Text
                    className={`text-[13px] ${theme === "dark" ? "text-white" : "text-black"} tracking-wide`}
                    style={{ fontFamily: "OpenSans-SemiBold" }}
                  >
                    Edit Profile
                  </Text>
                </View>
                <Icon
                  name={editProfileExpanded ? "chevron-up" : "chevron-down"}
                  size={17}
                  color={theme === "dark" ? "#666" : "black"}
                />
              </View>
            </TouchableHighlight>

            {editProfileExpanded && (
              <View className="ml-10 mt-2 gap-2">
                <TouchableHighlight
                  className={`flex-row items-center justify-between ${theme === "dark" ? "bg-[#2A2A2A]" : "bg-[#F5F5F7]"} rounded-xl`}
                  underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
                  onPress={() => navigation.navigate("EditUserName", { user })}
                  style={{
                    shadowColor: theme === "dark" ? "#000000" : "#555555",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 1,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-center justify-between w-full p-4">
                    <Text
                      className={`text-[12px] ${theme === "dark" ? "text-white" : "text-black"} tracking-wide`}
                      style={{ fontFamily: "OpenSans-Regular" }}
                    >
                      Edit Username
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={16}
                      color={theme === "dark" ? "#666" : "black"}
                    />
                  </View>
                </TouchableHighlight>

                <TouchableHighlight
                  className={`flex-row items-center justify-between ${theme === "dark" ? "bg-[#2A2A2A]" : "bg-[#F5F5F7]"} rounded-xl`}
                  underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
                  onPress={() => navigation.navigate("EditPassword", { user })}
                  style={{
                    shadowColor: theme === "dark" ? "#000000" : "#555555",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 1,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-center justify-between w-full p-4">
                    <Text
                      className={`text-[12px] ${theme === "dark" ? "text-white" : "text-black"} tracking-wide`}
                      style={{ fontFamily: "OpenSans-Regular" }}
                    >
                      Change Password
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={16}
                      color={theme === "dark" ? "#666" : "black"}
                    />
                  </View>
                </TouchableHighlight>
              </View>
            )}
          </View>

          <TouchableHighlight
            className={`flex-row items-center justify-between ${theme === "dark" ? "bg-[#262626]" : "bg-white"} rounded-xl`}
            underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
            onPress={toggleTheme}
            style={{
              shadowColor: theme === "dark" ? "#000000" : "#555555",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 1,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center justify-between w-full p-5">
              <View className="flex-row items-center gap-2.5">
                <Icon
                  name="moon-waning-crescent"
                  size={17}
                  color={theme === "dark" ? "white" : "black"}
                />
                <Text
                  className={`text-[13px] ${theme === "dark" ? "text-white" : "text-black"} tracking-wide`}
                  style={{ fontFamily: "OpenSans-SemiBold" }}
                >
                  Dark Mode
                </Text>
              </View>
              <Icon
                name={theme === "dark" ? "radiobox-marked" : "radiobox-blank"}
                size={15}
                color={theme === "dark" ? "#50A8EE" : "black"}
              />
            </View>
          </TouchableHighlight>
        </View>

        <View className="items-center justify-center mt-5 mb-5">
          <TouchableHighlight
            className="flex-row items-center justify-between p-4 rounded-xl"
            underlayColor={theme === "dark" ? "#333333" : "#e5e5e5"}
            onPress={() => setLogoutModalVisible(true)}
          >
            <View className="flex-row items-center gap-2.5">
              <Icon name="logout" size={18} color="#FF3B30" />
              <Text
                className="text-[13px] text-[#FF3B30] tracking-wide"
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Logout
              </Text>
            </View>
          </TouchableHighlight>
        </View>
      </ScrollView>

      <LogoutModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={handleLogout}
        theme={theme}
      />
    </View>
  );
};

export default ProfilePage;