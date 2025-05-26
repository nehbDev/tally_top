import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.1.21:8000/api";

const useVoteData = (pollId, showToast) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [voteResults, setVoteResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [votingDisabled, setVotingDisabled] = useState(false);
  const [stopPolling, setStopPolling] = useState(false); // Add state to control polling

  const fetchSelectedVote = useCallback(async () => {
    if (!pollId) {
      console.log('fetchSelectedVote: No pollId provided');
      return;
    }
    try {
      const userId = await AsyncStorage.getItem("user_id");
      if (!userId) return;

      const savedVote = await AsyncStorage.getItem(`selected_vote_${pollId}_${userId}`);
      setSelectedOption(savedVote ? parseInt(savedVote, 10) : null);
    } catch (error) {
      console.error("Error fetching selected vote:", error);
      showToast?.("error", "Failed to fetch selected vote");
    }
  }, [pollId, showToast]);

  const fetchVoteResults = useCallback(async () => {
    if (!pollId || stopPolling) {
      console.log('fetchVoteResults: No pollId or polling stopped');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/results/${pollId}`);
      setVoteResults(response.data.results || []);
      setTotalVotes(response.data.total_votes || 0);
    } catch (error) {
      //console.error(`Error refreshing vote results for poll ${pollId}:`, error);
      //if (error.response?.status === 404) {
        //showToast?.("error", `Poll ${pollId} not found`);
        //setStopPolling(true); // Stop polling on 404
      //} else {
        //showToast?.("error", "Failed to fetch vote results");
      //}
    }
  }, [pollId, showToast, stopPolling]);

  const handleVote = async (optionId) => {
    if (votingDisabled) return;

    try {
      setVotingDisabled(true);
      const userId = await AsyncStorage.getItem("user_id");
      const token = await AsyncStorage.getItem("auth_token");

      if (!userId || !token) {
        showToast?.("error", "Please log in to vote");
        return;
      }

      const isUnvoting = selectedOption === optionId;
      const response = await axios.post(
        `${API_BASE_URL}/vote`,
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

        showToast?.("success", response.data.message || "Vote processed successfully");
      } else {
        showToast?.("error", response.data.message || "Vote processing failed");
      }
    } catch (error) {
      console.error("Vote error:", error.response?.data || error);
      showToast?.("error", error.response?.data?.message || "Failed to process vote");
    } finally {
      setVotingDisabled(false);
    }
  };

  useEffect(() => {
    if (!pollId || stopPolling) return;

    fetchSelectedVote();
    fetchVoteResults();

    const interval = setInterval(fetchVoteResults, 30000); // Increased to 30 seconds
    return () => clearInterval(interval);
  }, [fetchSelectedVote, fetchVoteResults, pollId, stopPolling]);

  return { selectedOption, voteResults, totalVotes, handleVote, votingDisabled };
};

export default useVoteData;