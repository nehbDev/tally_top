import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  Alert,
  StatusBar,
  TouchableHighlight
} from 'react-native';
import useLoadFonts from '../../src/hooks/useLoadFonts';
import * as SplashScreen from 'expo-splash-screen';
import { showToast } from '../../src/utils/toastconfig';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';

SplashScreen.preventAutoHideAsync();

const SignUp = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const { loaded, fonterror } = useLoadFonts();
  if (!loaded && !fonterror) return null;

  const handleNext = async () => {
    const stepFields = {
      1: 'username',
      2: 'email',
      3: 'password',
    };

    const field = stepFields[step];
    if (!field) return;
    setErrors(prevErrors => ({ ...prevErrors, [field]: false }));

    const stepPayloads = {
      1: { username },
      2: { email },
      3: { password, password_confirmation: confirmPassword },
    };

    try {
      const response = await axios.post(API_URL, stepPayloads[step] || {});
      if (response?.data?.success) {
        setStep(prevStep => prevStep + 1);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Network error';
      showToast('error', errorMessage);
      setErrors(prevErrors => ({ ...prevErrors, [field]: true }));
    }
  };

  const API_URL = 'http://192.168.169.150:8000/api/validate-step';
  const API_BASE_URL = 'http://192.168.169.150:8000/api';

  const handleSignUp = useCallback(async () => {
    setLoading(true);
    setErrors({});

    try {
      console.log('Signing up with email:', email);
      const response = await axios.post(`${API_BASE_URL}/signup`, {
        username,
        email,
        password,
        password_confirmation: confirmPassword,
      });

      console.log('Signup Response:', response.data);

      if (response?.data?.success) {
        Alert.alert(
          'Verify Your Email',
          "We've sent a verification link to your email. Please check your inbox (and spam folder).",
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.replace('SignIn');
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        throw new Error(response?.data?.message || 'Sign-up failed');
      }
    } catch (error) {
      console.error('Signup Error:', error.response?.data);
      const errorMessage = error?.response?.data?.message || 'An error occurred. Please try again.';
      setErrors(prevErrors => ({
        ...prevErrors,
        username: true,
        email: true,
        password: true,
        confirmPassword: true,
      }));
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [username, email, password, confirmPassword, navigation]);

  const handleBackPress = useCallback(() => {
    if (step === 1 && username) {
      setExitModalVisible(true);
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  }, [step, username, navigation]);

  const handleSigninBack = useCallback(() => {
    const hasInput = username || email || password || confirmPassword;
  
    if (hasInput) {
      setExitModalVisible(true);
    } else {
      navigation.goBack(); 
    }
  }, [username, email, password, confirmPassword, navigation]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: {
        backgroundColor: '#FFFFFF',
        height: 55,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitle: '',
      headerShadowVisible: false,
      headerLeft: () => (
        <TouchableHighlight
          underlayColor="#F5F5F7"
          onPress={handleBackPress}
          className="px-2.5 rounded-full"
        >
          <Icon name="arrow-left" size={20} color="#000000" />
        </TouchableHighlight>
      ),
    });
  }, [navigation, step, username, handleBackPress]);

  return (
    <>
      <StatusBar backgroundColor="#50A8EE" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View className="flex-1 justify-center px-2.5 bg-white">
          <Text
            className="text-[32px] tracking-wider mb-1"
            style={{ fontFamily: 'OpenSans-Medium' }}
          >
            Sign Up
          </Text>
          <Text
            className="text-[16px] text-[#555] mb-12 tracking-wide"
            style={{ fontFamily: 'OpenSans-Regular' }}
          >
            Create your account
          </Text>

          {step === 1 && (
            <>
              <Text
                className="text-[13px] text-[#555] mb-4 tracking-wider"
                style={{ fontFamily: 'OpenSans-Regular' }}
              >
                Step {step} of 3
              </Text>
              <View
                className={`flex-row items-center border rounded-md bg-white px-2 h-16 mb-2 ${
                  errors.username ? 'border-red-500' : 'border-[#999]'
                }`}
              >
                <Icon
                  name="account-outline"
                  size={20}
                  color={errors.username ? '#FF4D4D' : '#999'}
                  style={{ position: 'absolute', right: 10 }}
                />
                <TextInput
                  className="flex-1 h-full text-black text-sm tracking-wider"
                  autoCorrect={false}
                  autoCapitalize="none"
                  placeholder="Username"
                  placeholderTextColor={errors.username ? '#FF4D4D' : '#999'}
                  value={username}
                  style={{ fontFamily: 'OpenSans-Regular' }}
                  onChangeText={text => {
                    setUsername(text);
                    setErrors(prev => ({ ...prev, username: false }));
                  }}
                />
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text
                className="text-[13px] text-[#555] mb-4 tracking-wider"
                style={{ fontFamily: 'OpenSans-Regular', fontWeight: 600 }}
              >
                Step {step} of 3
              </Text>
              <View
                className={`flex-row items-center border rounded-md bg-white px-2 h-16 mb-2 ${
                  errors.email ? 'border-red-500' : 'border-[#999]'
                }`}
              >
                <Icon
                  name="email-outline"
                  size={20}
                  color={errors.email ? '#FF4D4D' : '#999'}
                  style={{ position: 'absolute', right: 10 }}
                />
                <TextInput
                  className="flex-1 h-full text-black text-sm tracking-wider"
                  keyboardType="email-address"
                  autoCorrect={false}
                  value={email}
                  autoCapitalize="none"
                  placeholder="Email Address"
                  style={{ fontFamily: 'OpenSans-Regular' }}
                  onChangeText={text => {
                    setEmail(text);
                    setErrors(prev => ({ ...prev, email: false }));
                  }}
                />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text
                className="text-[13px] text-[#555] mb-4 tracking-wider"
                style={{ fontFamily: 'OpenSans-Regular', fontWeight: 600 }}
              >
                Step {step} of 3
              </Text>
              <View
                className={`flex-row items-center border rounded-md bg-white px-2 h-16 mb-2 ${
                  errors.password ? 'border-red-500' : 'border-[#999]'
                }`}
              >
                <TextInput
                  className="flex-1 h-full text-black text-sm tracking-wider"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Password"
                  onChangeText={text => {
                    setPassword(text);
                    setErrors(prev => ({ ...prev, password: false }));
                  }}
                  style={{ fontFamily: 'OpenSans-Regular' }}
                />
                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                  <Icon
                    name={passwordVisible ? 'eye-off' : 'eye'}
                    size={22}
                    color={errors.password ? '#FF4D4D' : '#666'}
                    className="ml-2"
                  />
                </TouchableOpacity>
              </View>
              <View
                className={`flex-row items-center border rounded-md bg-white px-2 h-16 mb-2 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-[#999]'
                }`}
              >
                <TextInput
                  className="flex-1 h-full text-black text-sm tracking-wider"
                  secureTextEntry={!confirmPasswordVisible}
                  value={confirmPassword}
                  placeholder="Confirm Password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={text => {
                    setConfirmPassword(text);
                    setErrors(prev => ({ ...prev, confirmPassword: false }));
                  }}
                  style={{ fontFamily: 'OpenSans-Regular' }}
                />
                <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                  <Icon
                    name={confirmPasswordVisible ? 'eye-off' : 'eye'}
                    size={22}
                    color={errors.confirmPassword ? '#FF4D4D' : '#666'}
                    className="ml-2"
                  />
                </TouchableOpacity>
              </View>
            </>
          )}

          {step < 3 ? (
            <TouchableHighlight
              underlayColor="#3F8CD6"
              className={`w-full p-3 rounded-2xl items-center bg-[#50A8EE] mt-3 mb-10 ${
                step === 3 && (!password || !confirmPassword) ? 'opacity-50' : ''
              }`}
              onPress={handleNext}
            >
              <Text
                className="text-white text-[15px] tracking-wider"
                style={{ fontFamily: 'OpenSans-Regular' }}
              >
                Next
              </Text>
            </TouchableHighlight>
          ) : (
            <TouchableOpacity
              className="w-full p-3 rounded-2xl items-center bg-[#50A8EE] mt-3 mb-10"
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  className="text-white text-[15px] tracking-wider"
                  style={{ fontFamily: 'OpenSans-Regular' }}
                >
                  Sign Up
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View className={isKeyboardVisible ? 'h-5' : 'h-0'} />

          <View className="flex-row justify-center mt-4">
            <Text
              className="text-[14px] text-gray-600 tracking-wide"
              style={{ fontFamily: 'OpenSans-Regular' }}
            >
              Already have an account?{' '}
            </Text>
            <TouchableHighlight
              underlayColor="#F5F5F7"
              className="px-2 rounded-full"
              onPress={handleSigninBack}
            >
              <Text
                className="text-[14px] text-[#50A8EE] tracking-wide"
                style={{ fontFamily: 'OpenSans-Semibold' }}
              >
                Sign In
              </Text>
            </TouchableHighlight>
          </View>
        </View>
        <Modal
          visible={exitModalVisible}
          transparent
          animationType="fade"
        >
          <View className="flex-1 bg-black/50 justify-end items-center">
            <View className="w-full bg-white p-6 rounded-xl shadow-lg">
              <Text
                className="text-[16px] mb-2 text-black tracking-wide"
                style={{ fontFamily: 'OpenSans-Regular', fontWeight: 600 }}
              >
                Do you want to stop creating your account?
              </Text>
              <Text
                className="text-[13px] text-gray-600 text-left mb-7 tracking-wide"
                style={{ fontFamily: 'OpenSans-Regular' }}
              >
                If you stop now, you’ll lose any progress you made.
              </Text>
              <View className="gap-5 justify-between w-full">
                <TouchableOpacity onPress={() => setExitModalVisible(false)}>
                  <Text
                    className="text-red-500 text-[14px] uppercase tracking-wide"
                    style={{ fontFamily: 'OpenSans-Regular' }}
                  >
                    Continue creating account
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setExitModalVisible(false);
                    navigation.goBack();
                  }}
                >
                  <Text
                    className="text-[#50A8EE] text-[14px] uppercase tracking-wide"
                    style={{ fontFamily: 'OpenSans-Regular' }}
                  >
                    Stop creating account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </>
  );
};

export default SignUp;