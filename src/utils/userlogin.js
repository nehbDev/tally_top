import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from './toastconfig';

const API_URL = 'http://192.168.0.48:8000/api/login';

// Helper function to store user data in AsyncStorage
const storeUserData = async ({ id, email, username, token }) => {
  const userObject = { id, email, username };
  await Promise.all([
    AsyncStorage.setItem('user_id', id.toString()),
    AsyncStorage.setItem('auth_token', token),
    AsyncStorage.setItem('user', JSON.stringify(userObject)),
  ]);
    console.log("Stored user:", userObject);
    return userObject;
};

// Optimized handleSignIn function
const handleSignIn = async (
  email,
  password,
  setLoading,
  setUserData,
  setValid,
  setErrors,
  navigation
) => {
  setLoading(true);
  setErrors({ email: false, password: false });
  setValid({ email: false, password: false });

  // // Client-side validation to avoid unnecessary API calls
  // if (!email || !password) {
  //   setErrors({ email: !email, password: !password });
  //   showToast('error', 'Please fill in all fields');
  //   setLoading(false);
  //   return;
  // }

  try {
    console.log('POST:', { url: API_URL, data: { email, password } });
    const { data } = await axios.post(API_URL, { email, password });
    console.log('Response:', data);

    if (data.success) {
      const userData = await storeUserData({ ...data.user, token: data.token });
      setUserData(userData);
      setValid({ email: true, password: true });
      // showToast('success', 'Login successful');
      navigation.reset({ index: 0, routes: [{ name: 'HomeScreen' }] });
    } else {
      throw new Error(data.message || 'Invalid credentials');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    console.error('Login Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config,
    });
    setErrors({ email: true, password: true });
    showToast('error', errorMessage);
  } finally {
    setLoading(false);
  }
};

export { handleSignIn };