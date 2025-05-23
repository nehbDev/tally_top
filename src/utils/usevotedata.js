import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from 'apiConfig';

const API_URL = getApiUrl('');

const useVoteData = (pollId, stopPolling = false) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [voteResults, setVoteResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [votingDisabled, setVotingDisabled] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSelectedVote = useCallback(async () => {
    if (!pollId) {
      console.log('fetchSelectedVote: No pollId provided');
      return;
    }
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) return;

      const savedVote = await AsyncStorage.getItem(`API_URL${pollId}_${userId}`);
      setSelectedOption(savedVote ? parseInt(savedVote, 10) : null);
    } catch (err) {
      console.error("Error fetching selected vote:", err);
      setError("Failed to fetch selected vote");
    }
  }, [pollId]);

  const fetchVoteResults = useCallback(async () => {
    if (!pollId) {
      console.log('fetchVoteResults: No pollId provided');
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/results/${pollId}`);
      setVoteResults(response.data.results || []);
      setTotalVotes(response.data.total_votes || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching vote results:", err);
      setError("Failed to fetch vote results");
    } finally {
      setLoading(false);
    }
  }, [pollId]);

  const handleVote = async (optionId) => {
    if (votingDisabled) return;

    try {
      setVotingDisabled(true);
      setError(null);
      const userId = await AsyncStorage.getItem("user_id");
      const token = await AsyncStorage.getItem("auth_token");

      if (!userId || !token) {
        setError("Please log in to vote");
        return;
      }

      const isUnvoting = selectedOption === optionId;
      const response = await axios.post(
        `${API_URL}/vote`,
        { poll_id: pollId, option_id: optionId, user_id: userId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        const newSelectedOption = isUnvoting ? null : optionId;
        setSelectedOption(newSelectedOption);
        setVoteResults(response.data.results);
        setTotalVotes(response.data.total_votes);

        const voteKey = `selected_vote_${pollId}_${userId}`;
        if (isUnvoting) {
          await AsyncStorage.removeItem(voteKey);
        } else {
          await AsyncStorage.setItem(voteKey, optionId.toString());
        }
      } else {
        setError(response.data.message || "Vote processing failed");
      }
    } catch (err) {
      console.error("Vote error:", err.response?.data || err);
      setError(err.response?.data?.message || "Failed to process vote");
    } finally {
      setVotingDisabled(false);
    }
  };

  useEffect(() => {
    if (!pollId) return;

    fetchSelectedVote();
    fetchVoteResults();

    let interval;
    if (!stopPolling) {
      interval = setInterval(fetchVoteResults, 5000);
    }
    return () => interval && clearInterval(interval);
  }, [fetchSelectedVote, fetchVoteResults, pollId, stopPolling]);

  return { selectedOption, voteResults, totalVotes, handleVote, votingDisabled, error, loading };
};

export default useVoteData;