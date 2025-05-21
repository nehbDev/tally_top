import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Bookmark = ({ navigation }) => {
  const [bookmarkedPolls, setBookmarkedPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookmarkedPolls = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        console.log('Token:', token);
        if (!token) {
          setError('Please sign in to view bookmarks');
          setLoading(false);
          return;
        }

        const response = await fetch('http://192.168.208.150:8002/api/bookmarks/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json', // Ensure server returns JSON
          },
        });

        console.log('Response Status:', response.status);
        const text = await response.text();
        console.log('Raw Response:', text);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = JSON.parse(text);
        if (data.success) {
          setBookmarkedPolls(data.polls || []);
          setError(null);
        } else {
          setError(data.message || 'Failed to fetch bookmarks');
        }
      } catch (err) {
        console.error('Fetch bookmarked polls error:', err);
        setError(`Failed to load bookmarked polls: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkedPolls();
  }, []);

  const renderPollItem = ({ item }) => (
    <TouchableOpacity
      style={styles.pollItem}
      onPress={() => navigation.navigate('PollDisplay', { poll: item })}
    >
      <Text style={styles.pollTitle}>{item.title}</Text>
      <Text style={styles.pollDescription}>
        {item.description || 'No description'}
      </Text>
      <Text style={styles.pollStatus}>
        {item.is_expired ? 'Expired' : 'Active'} - {item.type}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bookmarkedPolls.length === 0 ? (
        <Text style={styles.text}>No bookmarked polls yet!</Text>
      ) : (
        <FlatList
          data={bookmarkedPolls}
          renderItem={renderPollItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  listContainer: {
    padding: 10,
  },
  pollItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pollDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  pollStatus: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});

export default Bookmark;