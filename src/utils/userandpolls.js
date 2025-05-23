import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import { getApiUrl } from '../../apiConfig';

//const API_BASE_URL = "http://192.168.169.150:8000/api";
//const API_URL = `${API_BASE_URL}/getPolls`;
const API_URL = getApiUrl('getPolls');
const API_BASE_URL = getApiUrl('');
const useFetchUserAndPolls = () => {
  const [user, setUser] = useState(null);
  const [polls, setPolls] = useState([]);
  const [visiblePolls, setVisiblePolls] = useState([]);
  const [expiredPolls, setExpiredPolls] = useState({});
  const [remainingTimes, setRemainingTimes] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserAndPolls = useCallback(async () => {
    setRefreshing(true);
    try {
      const storedUser = await AsyncStorage.getItem("user");
      console.log("Raw AsyncStorage user:", storedUser);
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      console.log("Parsed user in fetchUserAndPolls:", parsedUser);
      setUser(parsedUser);

      const token = await AsyncStorage.getItem("auth_token");
      console.log("Fetching public polls with token:", token);

      const { data } = await axios.get(API_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!data.success || !Array.isArray(data.polls)) {
        showToast("error", "Failed to fetch polls.");
        setPolls([]);
        setVisiblePolls([]);
        return;
      }

      // Fetch total votes for all polls in a batch
      const pollIds = data.polls.map((poll) => poll.id);
      const voteResults = await Promise.all(
        pollIds.map(async (pollId) => {
          try {
            const response = await axios.get(`${API_BASE_URL}/results/${pollId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return { pollId, totalVotes: response.data.total_votes || 0 };
          } catch (error) {
            console.error(`Error fetching vote results for poll ${pollId}:`, error);
            return { pollId, totalVotes: 0 };
          }
        })
      );

      const voteResultsMap = voteResults.reduce((acc, { pollId, totalVotes }) => {
        acc[pollId] = totalVotes;
        return acc;
      }, {});

      const formattedPolls = data.polls
        .filter((poll) => poll.type === "public")
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((poll) => {
          const isCreatedByMe = parsedUser && poll.user?.id === parsedUser.id;
          console.log(
            "Poll ID:",
            poll.id,
            "isCreatedByMe:",
            isCreatedByMe,
            "User ID:",
            parsedUser?.id,
            "Poll Creator ID:",
            poll.user?.id,
            "Poll Data:",
            poll
          );
          return {
            ...poll,
            timeAgo: moment(poll.created_at).fromNow(),
            isCreatedByMe,
            totalVotes: voteResultsMap[poll.id] || 0, // Use real-time total votes
            totalBookmarks: poll.total_bookmarks || 0,
            totalComments: poll.total_comments || 0,
            duration: poll.duration || 60,
            expirationTime: new Date(new Date(poll.created_at).getTime() + (poll.duration || 60) * 60_000),
            isExpired: poll.is_expired,
          };
        });

      console.log("Formatted polls:", formattedPolls);

      setPolls((prevPolls) =>
        formattedPolls.map((newPoll) => {
          const existingPoll = prevPolls.find((p) => p.id === newPoll.id);
          return existingPoll ? { ...newPoll, isCreatedByMe: existingPoll.isCreatedByMe } : newPoll;
        })
      );
    } catch (error) {
      console.error("Error fetching polls:", error.message);
      console.error("Response:", error.response?.data);
      showToast("error", error.response?.data?.message || "Something went wrong.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addPollOptimistically = useCallback(
    (newPoll) => {
      const formattedPoll = {
        ...newPoll,
        timeAgo: moment(newPoll.created_at).fromNow(),
        isCreatedByMe: user && newPoll.user?.id === user.id,
        totalVotes: newPoll.total_votes || 0,
        totalBookmarks: newPoll.total_bookmarks || 0,
        totalComments: newPoll.total_comments || 0,
        duration: newPoll.duration || 60,
        expirationTime: new Date(new Date(newPoll.created_at).getTime() + (newPoll.duration || 60) * 60_000),
        isExpired: false,
      };
      setPolls((prevPolls) => [formattedPoll, ...prevPolls]);
    },
    [user]
  );

  const memoizedPolls = useMemo(() => polls, [polls]);

  useEffect(() => {
    if (!memoizedPolls.length) {
      setVisiblePolls([]);
      setExpiredPolls({});
      setRemainingTimes({});
      return;
    }

    const updatePolls = () => {
      const now = Date.now();
      let newExpiredPolls = {};
      let newRemainingTimes = {};
      let updatedVisiblePolls = [];

      memoizedPolls.forEach((poll) => {
        const expirationTime = poll.expirationTime.getTime();
        const gracePeriodEnd = expirationTime + 60_000;
        const isExpired = now > expirationTime;
        const isBeyondGracePeriod = now > gracePeriodEnd;

        newExpiredPolls[poll.id] = isExpired;

        if (!isBeyondGracePeriod) {
          updatedVisiblePolls.push(poll);
          const timeDiff = expirationTime - now;

          if (timeDiff <= 0) {
            newRemainingTimes[poll.id] = "Expired";
          } else {
            const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
            const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);

            if (days > 0) {
              newRemainingTimes[poll.id] = `${days} day${days !== 1 ? "s" : ""} left`;
            } else if (hours > 0) {
              newRemainingTimes[poll.id] = `${hours} hour${hours !== 1 ? "s" : ""} left`;
            } else if (minutes > 0) {
              newRemainingTimes[poll.id] = `${minutes} minute${minutes !== 1 ? "s" : ""} left`;
            } else {
              newRemainingTimes[poll.id] = `${seconds} second${seconds !== 1 ? "s" : ""} left`;
            }
          }
        }
      });

      setExpiredPolls((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newExpiredPolls)) {
          return newExpiredPolls;
        }
        return prev;
      });

      setRemainingTimes((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(newRemainingTimes)) {
          return newRemainingTimes;
        }
        return prev;
      });

      setVisiblePolls((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(updatedVisiblePolls)) {
          return updatedVisiblePolls;
        }
        return prev;
      });
    };

    updatePolls();
    const interval = setInterval(updatePolls, 1000);
    return () => clearInterval(interval);
  }, [memoizedPolls]);

  useEffect(() => {
    fetchUserAndPolls();
  }, [fetchUserAndPolls]);

  // Add a function to refresh total votes periodically
  useEffect(() => {
    const refreshVoteResults = async () => {
      if (!memoizedPolls.length) return;

      const pollIds = memoizedPolls.map((poll) => poll.id);
      const voteResults = await Promise.all(
        pollIds.map(async (pollId) => {
          try {
            const response = await axios.get(`${API_BASE_URL}/results/${pollId}`);
            return { pollId, totalVotes: response.data.total_votes || 0 };
          } catch (error) {
            console.error(`Error refreshing vote results for poll ${pollId}:`, error);
            return { pollId, totalVotes: 0 };
          }
        })
      );

      const voteResultsMap = voteResults.reduce((acc, { pollId, totalVotes }) => {
        acc[pollId] = totalVotes;
        return acc;
      }, {});

      setPolls((prevPolls) =>
        prevPolls.map((poll) => ({
          ...poll,
          totalVotes: voteResultsMap[poll.id] || poll.totalVotes || 0,
        }))
      );
    };

    // Refresh vote results every 5 seconds
    const interval = setInterval(refreshVoteResults, 5000);
    return () => clearInterval(interval);
  }, [memoizedPolls]);

  return { user, visiblePolls, expiredPolls, remainingTimes, refreshing, fetchUserAndPolls, addPollOptimistically };
};

export default useFetchUserAndPolls;