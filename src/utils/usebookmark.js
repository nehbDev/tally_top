import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from 'apiConfig'; // Absolute import with jsconfig.json

export const useBookmark = (poll) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error loading auth data:', err);
        setError('Failed to load authentication data');
      }
    };
    loadAuthData();
  }, []);

  useEffect(() => {
    setError(null); // Clear error on new poll or token
    const checkBookmark = async () => {
      if (!token || !poll?.id) return;
      try {
        const response = await fetch(getApiUrl(`bookmarks/${poll.id}/check`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.success) {
          setBookmarked(data.bookmarked);
        } else {
          setError(data.message);
        }
      } catch (error) {
        console.error('Check bookmark error:', error);
        setError('Failed to check bookmark status');
      }
    };
    checkBookmark();
  }, [poll?.id, token]);

  const toggleBookmark = async () => {
    if (!token) {
      setError('Please sign in to bookmark');
      return;
    }
    if (poll.type === 'private' && poll.user_id !== user?.id) {
      setError('This is a private poll');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`bookmarks/${poll.id}/toggle`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setBookmarked(data.bookmarked);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Toggle bookmark error:', error);
      setError('Failed to toggle bookmark');
    } finally {
      setLoading(false);
    }
  };

  return { bookmarked, toggleBookmark, loading, error };
};