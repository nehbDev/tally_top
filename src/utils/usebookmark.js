import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from '../../apiConfig';

export const useBookmark = (poll, showToast) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        console.log('Loaded user data:', { user: storedUser ? 'present' : 'missing' });
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setError('User data missing');
          showToast('error', 'Please sign in to bookmark');
        }
      } catch (err) {
        console.error('Error loading user data:', err.message);
        setError('Failed to load user data');
        showToast('error', 'Failed to load user data');
      }
    };
    loadUserData();
  }, [showToast]);

  // Fetch initial bookmark state
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      if (!poll?.id || !user?.id) {
        console.log('Skipping bookmark check:', { pollId: poll?.id, userId: user?.id });
        return;
      }
      setLoading(true);
      try {
        const url = getApiUrl(`bookmarks/${poll.id}/check?user_id=${user.id}`);
        console.log('Checking bookmark status at:', url);
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Bookmark check response:', data);
        if (data.success) {
          setBookmarked(data.bookmarked);
          setBookmarkCount(data.bookmark_count);
          setError(null);
        } else {
          setError(data.message);
          showToast('error', data.message);
        }
      } catch (error) {
        console.error('Check bookmark error:', error.message);
        let errorMessage = 'Failed to check bookmark status';
        if (error.message.includes('400')) {
          errorMessage = 'Invalid request data';
        } else if (error.message.includes('403')) {
          errorMessage = 'Unauthorized to view bookmark status';
        } else if (error.message.includes('404')) {
          errorMessage = 'Poll not found';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error';
        }
        setError(errorMessage);
        showToast('error', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarkStatus();
  }, [poll?.id, user?.id, showToast]);

  const toggleBookmark = async () => {
    if (!poll?.id) {
      setError('Invalid poll ID');
      showToast('error', 'Invalid poll');
      console.log('Bookmark failed: No poll ID');
      return;
    }
    if (!user?.id) {
      setError('User data missing');
      showToast('error', 'Please sign in to bookmark');
      console.log('Bookmark failed: No user ID');
      return;
    }

    setLoading(true);
    try {
      const url = getApiUrl('bookmark');
      console.log('Bookmarking at:', url, 'with body:', { poll_id: poll.id, user_id: user.id });
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ poll_id: poll.id, user_id: user.id }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Bookmark response:', data);
      if (data.success) {
        setBookmarked(data.bookmarked);
        setBookmarkCount(data.bookmark_count);
        setError(null);
        showToast('success', data.message);
      } else {
        setError(data.message);
        showToast('error', data.message);
      }
    } catch (error) {
      console.error('Bookmark error:', error.message);
      let errorMessage = 'Failed to toggle bookmark';
      if (error.message.includes('400')) {
        errorMessage = 'Invalid request data';
      } else if (error.message.includes('403')) {
        errorMessage = 'Unauthorized to bookmark this poll';
      } else if (error.message.includes('404')) {
        errorMessage = 'Poll not found';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error';
      }
      setError(errorMessage);
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { bookmarked, bookmarkCount, toggleBookmark, loading, error };
};