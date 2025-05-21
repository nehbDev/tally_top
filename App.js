import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, StatusBar, Animated } from "react-native";
import Toast from "react-native-toast-message";
import { toastConfig } from "./src/utils/toastconfig";
import * as SplashScreen from 'expo-splash-screen';
import SignIn from "./screens/auth/login";
import SignUp from "./screens/auth/signup";
import EditProfile from "./screens/editprofile";
import Profile from "./screens/profile";
import PollDisplay from "./screens/polldisplay";
import MyPrivatePolls from "./screens/myprivatepolls";
import MyPublicPolls from "./screens/mypublicpolls";
import NavBottom from "./src/components/navbottom";
import CreatePollPage from "./screens/createpoll";
import { ThemeProvider, ThemeContext } from './src/components/ThemeContext';
import LogoutScreen from "./src/components/logoutscreen";
import Bookmark from "./screens/bookmark";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import useFetchUserAndPolls from "./src/utils/userandpolls";

import "./global.css";

const Stack = createStackNavigator();

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <ThemeProvider>
      <AppContainer appIsReady={appIsReady} />
    </ThemeProvider>
  );
}

function AppContainer({ appIsReady }) {
  const { theme } = React.useContext(ThemeContext);
  const { fetchUserAndPolls, addPollOptimistically } = useFetchUserAndPolls();

  if (!appIsReady) {
    return (
      <View className={`flex-1 ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-white'}`} />
    );
  }

  const MyLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'white',
      card: 'white',
      text: '#50A8EE',
    },
  };

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#1A1A1A',
      card: '#1A1A1A',
      text: '#60B8FF',
    },
  };

  // Custom transition: New screen slides from right to left over the previous screen
  const slideRightToLeftTransition = ({ current, next, layouts }) => {
    const progress = Animated.add(current.progress, next ? next.progress : 0);

    return {
      cardStyle: {
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [
                layouts.screen.width, // Start off-screen right
                0, // Fully visible
                -layouts.screen.width, // Exit off-screen left
              ],
            }),
          },
        ],
      },
      overlayStyle: {
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.1], // Subtle overlay (optional)
        }),
      },
    };
  };

  return (
    <View className={`flex-1 ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-[#F5F5F7]'}`}>
      <StatusBar
        backgroundColor={theme === 'dark' ? '#1A1A1A' : '#50A8EE'}
      />
      <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={theme === 'dark' ? MyDarkTheme : MyLightTheme}>
        <Stack.Navigator
          initialRouteName="SignIn"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'transparent' }, // Transparent to show previous screen
            cardOverlayEnabled: true,
            cardStyleInterpolator: slideRightToLeftTransition, // Apply right-to-left slide
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 270 } },
              close: { animation: 'timing', config: { duration: 270 } },
            },
          }}
        >
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="Profile" component={Profile} />
          <Stack.Screen
              name="CreatePollPage"
              children={(props) => (
                <CreatePollPage
                  {...props}
                  theme={theme}
                  fetchUserAndPolls={fetchUserAndPolls}
                  addPollOptimistically={addPollOptimistically}
                />
              )}
            />
          <Stack.Screen name="PollDisplay" component={PollDisplay} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="MyPrivatePolls" component={MyPrivatePolls} />
          <Stack.Screen name="MyPublicPolls" component={MyPublicPolls} />
          <Stack.Screen name="Bookmark" component={Bookmark} />
          <Stack.Screen name="HomeScreen" component={NavBottom} />
          <Stack.Screen name="LogoutScreen" component={LogoutScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      </GestureHandlerRootView>
      <Toast config={toastConfig} />
    </View>
  );
}