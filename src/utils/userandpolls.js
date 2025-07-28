import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import { getApiUrl } from "../../apiConfig";

const API_URL = getApiUrl("getPolls");
const API_BASE_URL = getApiUrl("");

const useFetchUserAndPolls = () => {
  const [user, setUser] = useState(null);
  const [polls, setPolls] = useState([]);
  const [visiblePolls, setVisiblePolls] = useState([]);
  const [expiredPolls, setExpiredPolls] = useState({});
  const [remainingTimes, setRemainingTimes] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserAndPolls = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const storedUser = await AsyncStorage.getItem("user");
      let parsedUser = null;

      if (storedUser) {
        parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("✅ Loaded user from AsyncStorage:", parsedUser);
      } else {
        console.warn("⚠️ No user found in AsyncStorage");
        setUser(null);
      }

      const token = await AsyncStorage.getItem("auth_token");

      const { data } = await axios.get(API_URL, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!data.success || !Array.isArray(data.polls)) {
        setPolls([]);
        setVisiblePolls([]);
        setError("Invalid response from server");
        return;
      }

      const pollIds = data.polls.map((poll) => poll.id).filter(Boolean);
      let voteResultsMap = {};
      if (pollIds.length > 0) {
        const response = await axios.post(
          `${API_BASE_URL}results/batch`,
          { poll_ids: pollIds },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data.success) {
          voteResultsMap = response.data.results || {};
        }
      }

      const formattedPolls = data.polls
        .filter((poll) => poll.id)
        .map((poll) => {
          const isCreatedByMe = parsedUser && poll.user?.id === parsedUser.id;
          const createdAt = moment(poll.created_at).isValid()
            ? new Date(poll.created_at)
            : new Date();

          const expirationTime = poll.duration
            ? new Date(createdAt.getTime() + poll.duration * 60_000)
            : null;

          return {
            ...poll,
            timeAgo: moment(createdAt).fromNow(),
            isCreatedByMe,
            totalVotes: voteResultsMap[poll.id]?.total_votes || 0,
            totalBookmarks: poll.total_bookmarks || 0,
            totalComments: poll.total_comments || 0,
            duration: poll.duration ?? null,
            expirationTime,
            isExpired: poll.is_expired ?? false,
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setPolls((prevPolls) => {
        const mergedPolls = [...formattedPolls];
        prevPolls.forEach((prevPoll) => {
          if (!mergedPolls.find((p) => p.id === prevPoll.id) && prevPoll.isCreatedByMe) {
            mergedPolls.push(prevPoll);
          }
        });
        return mergedPolls.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      });
    } catch (error) {
      console.error("❌ Error fetching user and polls:", error);
      setError("Failed to fetch polls. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addPollOptimistically = useCallback((newPoll) => {
    const formattedPoll = {
      ...newPoll,
      id: newPoll.id || `temp-${Date.now()}`,
      timeAgo: moment(newPoll.created_at || Date.now()).fromNow(),
      isCreatedByMe: true,
      totalVotes: newPoll.total_votes || 0,
      totalBookmarks: newPoll.total_bookmarks || 0,
      totalComments: newPoll.total_comments || 0,
      duration: newPoll.duration ?? null,
      expirationTime: newPoll.duration
        ? new Date(new Date(newPoll.created_at || Date.now()).getTime() + newPoll.duration * 60_000)
        : null,
      isExpired: false,
    };
    setPolls((prevPolls) =>
      [...prevPolls, formattedPoll].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    );
  }, []);

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
      const newExpiredPolls = {};
      const newRemainingTimes = {};
      const updatedVisiblePolls = [];

      memoizedPolls.forEach((poll) => {
        if (!poll.id) return;

        if (poll.type === "public" || (poll.type === "private" && poll.isCreatedByMe)) {
          if (poll.duration === null) {
            newExpiredPolls[poll.id] = false;
            newRemainingTimes[poll.id] = "Ongoing";
            updatedVisiblePolls.push(poll);
            return;
          }

          const expirationTime = poll.expirationTime?.getTime();
          if (!expirationTime || isNaN(expirationTime)) {
            newExpiredPolls[poll.id] = true;
            newRemainingTimes[poll.id] = "Expired";
            updatedVisiblePolls.push(poll);
            return;
          }

          const isExpired = now > expirationTime;
          newExpiredPolls[poll.id] = isExpired;
          newRemainingTimes[poll.id] = isExpired
            ? "Expired"
            : (() => {
                const timeDiff = expirationTime - now;
                const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
                const hours = Math.floor((timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const minutes = Math.floor((timeDiff % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((timeDiff % (60 * 1000)) / 1000);

                if (days > 0) return `${days} day${days !== 1 ? "s" : ""} left`;
                if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""} left`;
                if (minutes > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""} left`;
                return `${seconds} second${seconds !== 1 ? "s" : ""} left`;
              })();

          updatedVisiblePolls.push(poll);
        }
      });

      setExpiredPolls(newExpiredPolls);
      setRemainingTimes(newRemainingTimes);
      setVisiblePolls(updatedVisiblePolls.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    };

    updatePolls();
    const interval = setInterval(updatePolls, 1000);
    return () => clearInterval(interval);
  }, [memoizedPolls]);

  useEffect(() => {
    fetchUserAndPolls();
  }, [fetchUserAndPolls]);

  useEffect(() => {
    const refreshVoteResults = async () => {
      if (!memoizedPolls.length) return;

      const pollIds = memoizedPolls.map((poll) => poll.id).filter(Boolean);
      if (pollIds.length === 0) return;

      try {
        const token = await AsyncStorage.getItem("auth_token");
        const response = await axios.post(
          `${API_BASE_URL}results/batch`,
          { poll_ids: pollIds },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data.success) {
          const voteResultsMap = response.data.results || {};
          setPolls((prevPolls) =>
            prevPolls
              .map((poll) => ({
                ...poll,
                totalVotes: voteResultsMap[poll.id]?.total_votes || poll.totalVotes || 0,
              }))
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          );
        }
      } catch (error) {
        console.error("Error refreshing vote results:", error);
      }
    };

    const interval = setInterval(refreshVoteResults, 30_000);
    return () => clearInterval(interval);
  }, [memoizedPolls]);

  return {
    user,
    visiblePolls,
    expiredPolls,
    remainingTimes,
    refreshing,
    fetchUserAndPolls,
    addPollOptimistically,
    error,
  };
};

export default useFetchUserAndPolls;
