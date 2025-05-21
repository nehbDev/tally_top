import React, { useState, useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, TextInput, Image, Alert, TouchableHighlight } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as SplashScreen from 'expo-splash-screen';

//fetch the user and poll logic
import useFetchUserAndPolls from '../src/utils/userandpolls';
//font-family

import useLoadFonts from '../src/hooks/useLoadFonts';


import { ThemeContext } from '../src/components/ThemeContext';


SplashScreen.preventAutoHideAsync();

const avatarMap = {
  "default-avatar.webp": require("../assets/images/default-avatar.webp"),
  "female-avatar.jpg": require("../assets/images/female-avatar.jpg"),
  "male-avatar.png": require("../assets/images/male-avatar.png"),
};


const HomeScreen = ({ navigation }) => {
  const { user, visiblePolls, expiredPolls, remainingTimes, refreshing, fetchUserAndPolls } = useFetchUserAndPolls();
  const [searchQuery, setSearchQuery] = useState('');

  //fonts
  const { loaded, fonterror } = useLoadFonts();
  if (!loaded && !fonterror) return null;

  const { theme } = useContext(ThemeContext); 


  const handlePollPress = (poll) => {
    navigation.navigate('PollDisplay', { poll });
  };


  const filteredPolls = useMemo(() => {
    return visiblePolls.filter((poll) => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const username = poll.isCreatedByMe ? 'Me' : poll.user?.username || 'Unknown';
      const title = poll.title || '';
      const link = poll.link || '';
      return (
        username.toLowerCase().includes(lowerCaseQuery) ||
        title.toLowerCase().includes(lowerCaseQuery) ||
        link.toLowerCase().includes(lowerCaseQuery)
      );
    });
  }, [visiblePolls, searchQuery]);

  const isPollExpired = (poll) => {
    const now = Date.now();
    const expirationTime = new Date(poll.created_at).getTime() + poll.duration * 60 * 1000;
    return now > expirationTime;
  };

  const refreshControlTintColor = theme === "dark" ? "#60B8FF" : "#50A8EE";
  const refreshControlColors = theme === "dark" ? ["#60B8FF"] : ["#50A8EE"];
  const progressBackgroundColor = theme === "dark" ? "#2A2A2A" : "#F5F5F7";
  

  // console.log("HomeScreen user at render:", user);

  return (
    <View className={`flex-1 px-1 h-full ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-[#F5F5F7]'}`}>
      <View className={`px-2.5 py-2.5   ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-[#F5F5F7]'}`}>
        <View className="flex-row items-center border border-[#dee2e6] rounded-sm">
          <TextInput
            className={`flex-1 h-[40px] px-3  text-[12px] tracking-wide ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}
            placeholder="Search by username or title..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme === 'dark' ? 'white' : '#444'}
            style={{ fontFamily: 'OpenSans-Medium' }}
          />
          <Icon name="magnify" size={22} color={theme === 'dark' ? '#fff' : '#555'} className="mr-2.5" />
        </View>
      </View>


      <ScrollView
        className="w-full px-2.5 mt-2.5"
        contentContainerStyle={{ paddingBottom: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchUserAndPolls}  
          tintColor={refreshControlTintColor} 
          colors={refreshControlColors}
          progressBackgroundColor={progressBackgroundColor}
          />}
      >
        {filteredPolls.length > 0 ? (
          filteredPolls
            .slice()
            .sort((a, b) => {
              const aExpired = expiredPolls[a.id] ?? isPollExpired(a);
              const bExpired = expiredPolls[b.id] ?? isPollExpired(b);
              return aExpired - bExpired;
            })
            .map((poll, index) => (
              
              <TouchableOpacity
                key={index}
                disabled={expiredPolls[poll.id]}
                className={`p-4 mb-2.5 rounded-lg shadow-xl elevation-7 ${theme === 'dark' ? 'bg-[#262626]' : 'bg-white shadow-black/50'} ${
                  expiredPolls[poll.id] ? 'opacity-50' : 'opacity-100'
                }`}
                onPress={() => !expiredPolls[poll.id] && handlePollPress(poll)}
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-start">
                    {/* Avatar Image */}
                      <Image
                        source={
                          poll.isCreatedByMe && user?.avatar && avatarMap[user.avatar]
                            ? avatarMap[user.avatar]
                            : poll.user?.avatar && avatarMap[poll.user.avatar]
                            ? avatarMap[poll.user.avatar]
                            : require("../assets/images/default-avatar.webp")
                        }
                        className="w-[35px] h-[35px] rounded-full mr-2"
                        onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
                      />
                    {/* Username and Time Ago in a column */}
                    <View className="flex-col">
                      <Text
                        className={`text-[12px] tracking-wide ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`}
                        style={{ fontFamily: 'OpenSans-SemiBold' }}
                      >
                         {poll.isCreatedByMe ? 'By Me' : poll.user?.username || 'Unknown'}
                      </Text>
                      <Text
                        className={`text-[11px] tracking-normal ${
                          theme === 'dark' ? 'text-[#ccc]' : 'text-[#555]'
                        }`}
                        style={{ fontFamily: 'OpenSans-Medium' }}
                      >
                        {poll.timeAgo}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text
                  className={`text-[20px] tracking-wide ${
                    theme === 'dark'? 'text-white' : 'text-black'
                  }`}
                  style={{ fontFamily: 'OpenSans-SemiBold' }}
                  numberOfLines={2}
                  ellipsizeMode="head"
                >
                  {poll.title}
                </Text>
                <Text
                  className={`text-[15px]  mb-6 tracking-wide ${
                    theme === 'dark'? 'text-white' : 'text-black'
                  }`}
                  style={{ fontFamily: 'OpenSans-Medium' }}
                  numberOfLines={2}
                  ellipsizeMode="head"
                >
                  {poll.description ? poll.description : <Text className="italic text-[12px]">No description</Text>}
                </Text>
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2.5">
                    <Text
                      className="text-[11px] text-[#50A8EE] tracking-wide"
                      style={{ fontFamily: 'OpenSans-SemiBold' }}
                    >
                      {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                    </Text>
                    <View className="flex-row items-center">
                      <Icon name="bookmark-outline" size={15} color={theme === 'dark' ? '#fff' : '#555'} />
                      <Text className="ml-0.5 text-[11px] text-[#555] tracking-tight"></Text>
                    </View>
                    <View className="flex-row items-center">
                      <Icon name="comment-outline" size={14.5} color={theme === 'dark' ? '#fff' : '#555'} />
                      <Text className="ml-0.5 text-[11px] text-[#555] tracking-tight"></Text>
                    </View>
                  </View>
                  <Text
                    className={`text-[10px] tracking-wide ${
                      expiredPolls[poll.id]
                        ? 'text-red-500' 
                        : theme === 'dark'
                        ? 'text-white' 
                        : 'text-black' 
                    }`}
                    style={{ fontFamily: expiredPolls[poll.id] ? 'OpenSans-Bold' : 'OpenSans-Regular' }}
                  >
                    {remainingTimes[poll.id] || 'Calculating...'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
        ) : (
          <Text
            className="text-center mt-12 text-lg text-[#555]"
            style={{ fontFamily: 'Inter-Medium' }}
          >
            No polls available.
          </Text>
        )}
      </ScrollView>

    </View>
  );
};

export default HomeScreen;