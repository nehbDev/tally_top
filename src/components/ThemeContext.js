import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light'); // Default to light mode
  const [userId, setUserId] = useState(null); // Store the current user ID

  // Fetch the current user ID from AsyncStorage
  const fetchUserId = useCallback(async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      setUserId(storedUserId);
      return storedUserId;
    } catch (error) {
      console.error('Failed to fetch user ID:', error);
      return null;
    }
  }, []);

  // Load the theme for the current user
  const loadTheme = useCallback(async () => {
    try {
      const currentUserId = await fetchUserId();
      if (!currentUserId) {
        setTheme('light'); // Default to light mode if no user is logged in
        return;
      }

      const savedTheme = await AsyncStorage.getItem(`theme_${currentUserId}`);
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        setTheme('light'); // Default to light mode if no theme is saved for this user
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      setTheme('light'); // Fallback to light mode on error
    }
  }, [fetchUserId]);

  // Toggle the theme and save it for the current user
  const toggleTheme = async () => {
    try {
      if (!userId) {
        console.warn('No user logged in, cannot toggle theme');
        return;
      }

      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem(`theme_${userId}`, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  // Monitor user ID changes (e.g., login/logout) and reload the theme
  useEffect(() => {
    loadTheme(); // Load theme on initial render

    // Optional: Listen for user ID changes (e.g., login/logout)
    const checkUserId = async () => {
      const currentUserId = await AsyncStorage.getItem('user_id');
      if (currentUserId !== userId) {
        setUserId(currentUserId);
        loadTheme(); // Reload theme when user ID changes
      }
    };

    // Poll for user ID changes (e.g., every 1 second)
    const interval = setInterval(checkUserId, 100);
    return () => clearInterval(interval);
  }, [userId, loadTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, userId }}>
      {children}
    </ThemeContext.Provider>
  );
};


// import React, { createContext, useState, useEffect } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export const ThemeContext = createContext();

// export const ThemeProvider = ({ children }) => {
//   const [theme, setTheme] = useState('light'); // Default to light mode

//   // Load theme from AsyncStorage on app start
//   useEffect(() => {
//     const loadTheme = async () => {
//       try {
//         const savedTheme = await AsyncStorage.getItem('theme');
//         if (savedTheme) {
//           setTheme(savedTheme);
//         }
//       } catch (error) {
//         console.error('Failed to load theme:', error);
//       }
//     };
//     loadTheme();
//   }, []);

//   // Save theme to AsyncStorage whenever it changes
//   const toggleTheme = async () => {
//     const newTheme = theme === 'light' ? 'dark' : 'light';
//     setTheme(newTheme);
//     try {
//       await AsyncStorage.setItem('theme', newTheme);
//     } catch (error) {
//       console.error('Failed to save theme:', error);
//     }
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };  