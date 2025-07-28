import { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "apiConfig";

const usePollInteractions = (polls, showToast) => {
  const [interactions, setInteractions] = useState({});

  useEffect(() => {
    const initializeInteractions = async () => {
      const token = await AsyncStorage.getItem("auth_token");
      const userId = await AsyncStorage.getItem("user_id");
      const parsedUserId = userId ? parseInt(userId, 10) : null;

      const newInteractions = {};
      for (const poll of polls) {
        let voteData = {
          selectedOption: null,
          showPercentage: false,
          voteResults: poll.choices.map((choice) => ({
            option_id: choice.id,
            percentage: choice.percentage || 0,
          })),
          totalVotes: poll.totalVotes || 0,
          votingDisabled: false,
        };

        try {
          const voteResponse = await axios.get(
            getApiUrl(`get-vote/${poll.id}`),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (voteResponse.data.success) {
            voteData = {
              ...voteData,
              selectedOption: voteResponse.data.option_id,
              showPercentage: true,
              voteResults: voteResponse.data.results,
              totalVotes: voteResponse.data.total_votes,
            };
          }
        } catch (error) {
          console.error("Fetch vote error:", error);
        }

        let bookmarkData = { bookmarked: false, loading: false };

        try {
          const bookmarkResponse = await axios.get(
            getApiUrl(`bookmark-status/${poll.id}`),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (bookmarkResponse.data.success) {
            bookmarkData = {
              bookmarked: bookmarkResponse.data.bookmarked,
              loading: false,
            };
          }
        } catch (error) {
          console.error("Fetch bookmark error:", error);
        }

        newInteractions[poll.id] = {
          voteData: {
            ...voteData,
            handleVote: async (optionId) => {
              try {
                setInteractions((prev) => ({
                  ...prev,
                  [poll.id]: {
                    ...prev[poll.id],
                    voteData: {
                      ...prev[poll.id].voteData,
                      votingDisabled: true,
                    },
                  },
                }));

                const response = await axios.post(
                  getApiUrl("vote-gpoll"),
                  {
                    g_poll_id: poll.id,
                    option_id: optionId,
                    user_id: parsedUserId,
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                  setInteractions((prev) => ({
                    ...prev,
                    [poll.id]: {
                      ...prev[poll.id],
                      voteData: {
                        ...prev[poll.id].voteData,
                        selectedOption:
                          response.data.results.find(
                            (r) => r.option_id === optionId
                          )?.option_id || optionId,
                        voteResults: response.data.results,
                        totalVotes: response.data.total_votes,
                        showPercentage: true,
                        votingDisabled: false,
                      },
                    },
                  }));
                  showToast("success", response.data.message);
                }
              } catch (error) {
                showToast(
                  "error",
                  error.response?.data?.message || "Failed to vote"
                );
                setInteractions((prev) => ({
                  ...prev,
                  [poll.id]: {
                    ...prev[poll.id],
                    voteData: {
                      ...prev[poll.id].voteData,
                      votingDisabled: false,
                    },
                  },
                }));
              }
            },
          },
          bookmarkData: {
            ...bookmarkData,
            toggleBookmark: async () => {
              try {
                setInteractions((prev) => ({
                  ...prev,
                  [poll.id]: {
                    ...prev[poll.id],
                    bookmarkData: {
                      ...prev[poll.id].bookmarkData,
                      loading: true,
                    },
                  },
                }));

                const response = await axios.post(
                  getApiUrl("toggle-bookmark"),
                  { poll_id: poll.id },
                  { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                  setInteractions((prev) => ({
                    ...prev,
                    [poll.id]: {
                      ...prev[poll.id],
                      bookmarkData: {
                        bookmarked: response.data.bookmarked,
                        loading: false,
                      },
                    },
                  }));
                  showToast("success", response.data.message);
                }
              } catch (error) {
                showToast(
                  "error",
                  error.response?.data?.message ||
                    "Failed to toggle bookmark"
                );
                setInteractions((prev) => ({
                  ...prev,
                  [poll.id]: {
                    ...prev[poll.id],
                    bookmarkData: {
                      ...prev[poll.id].bookmarkData,
                      loading: false,
                    },
                  },
                }));
              }
            },
          },
        };
      }

      setInteractions(newInteractions);
    };

    initializeInteractions();
  }, [polls, showToast]);

  const getPollInteraction = (pollId) => {
    return (
      interactions[pollId] || {
        voteData: {
          selectedOption: null,
          showPercentage: false,
          voteResults: [],
          totalVotes: 0,
          handleVote: () => {},
          votingDisabled: true,
        },
        bookmarkData: {
          bookmarked: false,
          toggleBookmark: () => {},
          loading: false,
        },
      }
    );
  };

  return { getPollInteraction };
};

export default usePollInteractions;
