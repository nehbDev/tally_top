import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const avatarMap = {
  "default-avatar.webp": require("../../assets/images/default-avatar.webp"),
  "female-avatar.jpg": require("../../assets/images/female-avatar.jpg"),
  "male-avatar.png": require("../../assets/images/male-avatar.png"),
};

const LogoutScreen = ({ navigation, route }) => {
  const { user, theme } = route.params;
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, 300);

    const logout = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 5000));
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("user_id");
        console.log("User data removed!");
        navigation.reset({
          index: 0,
          routes: [{ name: "SignIn" }],
        });
      } catch (error) {
        console.error("Logout error:", error);
        navigation.reset({
          index: 0,
          routes: [{ name: "SignIn" }],
        });
      }
    };

    logout();

    return () => clearInterval(interval);
  }, [navigation]);

  return (
    <View className={`flex-1 justify-center items-center ${
      theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-[#F5F5F7]'
    }`}>
      <Image
        source={
          user?.avatar && avatarMap[user.avatar]
            ? avatarMap[user.avatar]
            : require("../../assets/images/default-avatar.webp")
        }
        className="w-[100px] h-[100px] rounded-full border-2 border-[#50A8EE] mb-5"
      />
      <Text
        className={`text-[18px] ${
          theme === 'dark' ? 'text-white' : 'text-black'
        } tracking-wide`}
        style={{ fontFamily: 'OpenSans-SemiBold' }}
      >
        Logging out{'.'.repeat(dotCount)}
      </Text>
    </View>
  );
};

export default LogoutScreen;