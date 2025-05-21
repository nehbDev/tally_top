import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerPlaceholder from 'react-native-shimmer-placeholder';
import LinearGradient from 'react-native-linear-gradient';

const PollSkeleton = ({ theme }) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme === 'dark' ? '#262626' : '#fff',
          shadowColor: theme === 'dark' ? '#000' : '#000',
        },
      ]}
    >
      <View style={styles.header}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          style={styles.avatar}
          shimmerColors={theme === 'dark' ? ['#333', '#444', '#333'] : ['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <View style={styles.userInfo}>
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.username}
            shimmerColors={theme === 'dark' ? ['#333', '#444', '#333'] : ['#e0e0e0', '#f5f5f5', '#e0e0e0']}
          />
          <ShimmerPlaceholder
            LinearGradient={LinearGradient}
            style={styles.timeAgo}
            shimmerColors={theme === 'dark' ? ['#333', '#444', '#333'] : ['#e0e0e0', '#f5f5f5', '#e0e0e0']}
          />
        </View>
      </View>
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.title}
        shimmerColors={theme === 'dark' ? ['#333', '#444', '#333'] : ['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      />
      <ShimmerPlaceholder
        LinearGradient={LinearGradient}
        style={styles.description}
        shimmerColors={theme === 'dark' ? ['#333', '#444', '#333'] : ['#e0e0e0', '#f5f5f5', '#e0e0e0']}
      />
      <View style={styles.footer}>
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          style={styles.votes}
          shimmerColors={theme === 'dark' ? ['#333', '#444', '#333'] : ['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
        <ShimmerPlaceholder
          LinearGradient={LinearGradient}
          style={styles.timeRemaining}
          shimmerColors={theme === 'dark' ? ['#333', '#444', '#333'] : ['#e0e0e0', '#f5f5f5', '#e0e0e0']}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 7,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 8,
  },
  userInfo: {
    flexDirection: 'column',
  },
  username: {
    width: 100,
    height: 12,
    borderRadius: 4,
    marginBottom: 4,
  },
  timeAgo: {
    width: 60,
    height: 10,
    borderRadius: 4,
  },
  title: {
    width: '90%',
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  description: {
    width: '100%',
    height: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  votes: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  timeRemaining: {
    width: 80,
    height: 12,
    borderRadius: 4,
  },
});

export default PollSkeleton;