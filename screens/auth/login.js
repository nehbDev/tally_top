import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  TouchableHighlight
} from 'react-native';
import { handleSignIn } from '../../src/utils/userlogin';
import useLoadFonts from '../../src/hooks/useLoadFonts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const SignIn = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [errors, setErrors] = useState({ email: false, password: false });
  const [valid, setValid] = useState({ email: false, password: false });

  const { loaded, fonterror } = useLoadFonts();

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = await AsyncStorage.getItem('auth_token');

      if (token) {
        navigation.replace('Home');
      } else {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  if (!loaded && !fonterror) return null;

  return (
    <>
      <StatusBar
        backgroundColor="#50A8EE"
        // barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      {Platform.OS === 'os' && (
        <View className="bg-[#50A8EE]" />
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 justify-center px-2.5 bg-white">
            <Text
              className="text-[32px] tracking-wider mb-1"
              style={{ fontFamily: 'OpenSans-Medium' }}
            >
              Sign In
            </Text>
            <Text
              className="text-[16px] text-gray-600 mb-12 tracking-wide"
              style={{ fontFamily: 'OpenSans-Regular' }}
            >
              Log in to your account
            </Text>

            {/* Email Input */}
            <View
              className={`flex-row items-center border rounded-md bg-white px-2 h-16 mb-2 ${
                errors.email ? 'border-red-500' : valid.email ? 'border-green-500' : 'border-[#999]'
              }`}
            >
              <Icon
                name="email-outline"
                size={20}
                style={{ position: 'absolute', right: 10 }}
                color={errors.email ? '#FF4D4D' : valid.email ? '#4CAF50' : '#999'}
              />
              <TextInput
                className="flex-1 h-full text-black text-sm tracking-wider"
                keyboardType="email-address"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                placeholder="Email address"
                placeholderTextColor={errors.email ? '#FF4D4D' : valid.email ? '#4CAF50' : '#999'}
                style={{ fontFamily: 'OpenSans-Regular' }}
              />
            </View>

            {/* Password Input */}
            <View
              className={`flex-row items-center border rounded-md bg-white px-2 h-16 mb-4 ${
                errors.password ? 'border-red-500' : valid.password ? 'border-green-500' : 'border-[#999]'
              }`}
            >
              <TextInput
                className="flex-1 h-full text-black text-sm tracking-wider"
                secureTextEntry={!passwordVisible}
                autoCorrect={false}
                autoCapitalize="none"
                placeholder="Password"
                onChangeText={setPassword}
                value={password}
                placeholderTextColor={errors.password ? '#FF4D4D' : valid.password ? '#4CAF50' : '#999'}
                style={{ fontFamily: 'OpenSans-Regular' }}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Icon
                  name={passwordVisible ? 'eye-off' : 'eye'}
                  size={22}
                  color={errors.password ? '#FF4D4D' : valid.password ? '#4CAF50' : '#999'}
                />
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableHighlight
              underlayColor="#3F8CD6"
              className="w-full p-3 rounded-2xl items-center bg-[#50A8EE] mt-3 mb-10"
              onPress={() =>
                handleSignIn(email, password, setLoading, setUserData, setValid, setErrors, navigation)
              }
            >
              <Text
                className="text-white text-[15px] tracking-wider"
                style={{ fontFamily: 'OpenSans-Regular' }}
              >
                Log in
              </Text>
            </TouchableHighlight>

            <View className="flex-row justify-center mt-4">
              <Text
                className="text-[14px] text-[#555] tracking-wide"
                style={{ fontFamily: 'OpenSans-Regular' }}
              >
                Don't have an account?{' '}
              </Text>
              <TouchableHighlight
                underlayColor="#F5F5F7"
                className="px-2 rounded-full"
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text
                  className="text-[14px] text-[#50A8EE] tracking-wide"
                  style={{ fontFamily: 'OpenSans-Semibold' }}
                >
                  Sign Up
                </Text>
              </TouchableHighlight>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default SignIn;