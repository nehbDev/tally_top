import React, { useContext, useState, useCallback } from "react";
import { TouchableOpacity, View, Text, StatusBar, Platform, Modal, Alert, TouchableHighlight } from 'react-native';
// import { CurvedBottomBarExpo } from 'react-native-curved-bottom-bar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from "@react-navigation/native"; 
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import QRCodeScannerModal from "./QRCodeScannerModal";
import useLoadFonts from '../hooks/useLoadFonts';
import HomeScreen from '../../screens/home';
import PrivatePoll from '../../screens/privatepoll';
import Profile from '../../screens/profile'; 
import Bookmark from '../../screens/bookmark';
import { ThemeContext } from './ThemeContext';
import useFetchUserAndPolls from "../utils/userandpolls";

const Tab = createBottomTabNavigator();
// const { width } = Dimensions.get("window");
const NavBottom = () => {
  const { loaded, error } = useLoadFonts();
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const [scannerVisible, setScannerVisible] = useState(false);
  const { visiblePolls, fetchUserAndPolls } = useFetchUserAndPolls();  

 const _renderIcon = (routeName, focused) => {
  let iconName;
  switch (routeName) {
    case "Home":
      iconName = focused ? "home" : "home-outline";
      break;
    case "PrivatePoll":
      iconName = focused ? "lock" : "lock-outline";
      break;
    case "Profile":
      iconName = focused ? "account" : "account-outline";
      break;
    case "CreatePoll":
      iconName = "plus-circle";
      break;
    case "Bookmark":
      iconName = focused ? "bookmark" : "bookmark-outline";
      break;
    default:
      iconName = "home-outline";
  }

  return (
    <View className="items-center">
      <Icon
        name={iconName}
        size={routeName === "CreatePoll" ? 30 : 25}
        color={
          routeName === "CreatePoll"
            ? theme === "dark"
              ? "#60B8FF"
              : "#50A8EE"
            : focused
            ? theme === "dark"
              ? "#60B8FF"
              : "#50A8EE"
            : theme === "dark"
            ? "#fff"
            : "#555"
        }
      />
    </View>
  );
};

  // const renderTabBar = ({ routeName, selectedTab, navigate }) => {
  //   return (
  //     <TouchableOpacity
  //       onPress={() => navigate(routeName)}
  //       className="flex-1 items-center justify-center"
  //     >
  //       {_renderIcon(routeName, selectedTab)}
  //       {routeName === selectedTab && routeName !== 'Profile' && (
  //         <View
  //           className={`w-5 h-1 mt-1 ${
  //             theme === 'dark' ? 'bg-[#60B8FF]' : 'bg-[#50A8EE]'
  //           }`}
  //         />
  //       )}
  //     </TouchableOpacity>
  //   );
  // };

  const handleQRScan = useCallback((pollId) => {
    setScannerVisible(false);
    const scannedPoll = visiblePolls.find(poll => poll.id === pollId);
    if (scannedPoll) {
      Alert.alert(
        "Success",
        `Poll found: ${scannedPoll.title}`,
        [{ text: "View", onPress: () => navigation.navigate('PollDisplay', { poll: scannedPoll }) }]
      );
    } else {
      Alert.alert(
        "Error",
        `Poll with ID ${pollId} not found or not accessible`,
        [{ text: "OK" }]
      );
      fetchUserAndPolls();
    }
  }, [visiblePolls, navigation, fetchUserAndPolls]);

  const CustomHeader = () => {
    const route = useRoute();
    const getHeaderText = (routeName) => {
      switch (routeName) {
        case 'Home':
          return 'PollNow';
        case 'PrivatePoll':
          return 'Private Poll';
        case 'Profile':
          return 'Profile';
        case 'Bookmark':
          return 'Bookmark';
        default:
          return routeName;
      }
    };

    return (
      <View
          className={`flex-row items-center justify-between w-full px-3 py-2.5 border-b ${
            theme === 'dark' ? 'bg-[#1A1A1A] border-none' : 'bg-[#F5F5F7] border-[#dee2e6]'
          }`}
        >
          <Text
            className={`text-[22px] tracking-wider ${
              theme === 'dark' ? 'text-white' : 'text-[#50A8EE]'
            }`}
            style={{ fontFamily: 'Raleway-Bold' }}
          >
            {getHeaderText(route.name)}
          </Text>
          <View className="flex-row items-center gap-3">
            <View>
              <TouchableHighlight
                underlayColor={theme === 'dark' ? '#444' : '#ddd'} 
                onPress={() => setScannerVisible(true)} 
                className="p-2"
              >
                <Icon
                  name="qrcode-scan"
                  size={20}
                  color={theme === 'dark' ? '#fff' : '#50A8EE'}
                />
              </TouchableHighlight>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
              <Icon
                name="bell"
                size={20}
                color={theme === 'dark' ? '#fff' : '#50A8EE'}
              />
            </TouchableOpacity>
          </View>
      </View>
    );
  };

  const openCreatePollScreen = () => {
    navigation.navigate('CreatePollPage'); 
  };

  if (!loaded && !error) {
    return (
      <View className={`flex-1 ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
      <StatusBar
        backgroundColor={theme === 'dark' ? '#1A1A1A' : '#50A8EE'}
      />
      {Platform.OS === 'ios' && (
        <View
          className={theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-[#50A8EE]'}
        />
      )}

      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: true,
          header: () => <CustomHeader />,
          tabBarIcon: ({ focused }) => _renderIcon(route.name, focused),
          tabBarStyle: {
            backgroundColor: theme === "dark" ? "#2A2A2A" : "white",
            borderTopColor: theme === "dark" ? "#444" : "#ddd",
            borderTopWidth: 1,
            height: 55,
          },
          tabBarActiveTintColor: theme === "dark" ? "#60B8FF" : "#50A8EE",
          tabBarInactiveTintColor: theme === "dark" ? "#fff" : "#555",
          tabBarShowLabel: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="PrivatePoll" component={PrivatePoll} />
        <Tab.Screen
          name="CreatePoll"
          component={View} // Placeholder component
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Prevent default navigation
              openCreatePollScreen();
            },
          }}
        />
        <Tab.Screen name="Bookmark" component={Bookmark} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>

      <Modal
        transparent={false}
        visible={scannerVisible}
        animationType="none"
        onRequestClose={() => setScannerVisible(false)}
      >
        <QRCodeScannerModal
          onScan={handleQRScan}
          onClose={() => setScannerVisible(false)}
          theme={theme}
        />
      </Modal>
    </View>
  );
};

export default NavBottom;