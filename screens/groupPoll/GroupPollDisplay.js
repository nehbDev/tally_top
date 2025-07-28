import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import Toast from "react-native-toast-message";
import { ThemeContext } from "src/components/ThemeContext";
import { toastConfig, showToast } from "src/utils/toastconfig";
import useLoadFonts from "src/hooks/useLoadFonts";
import usePollInteractions from "src/utils/usePollInteractions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Menu, MenuItem } from "react-native-material-menu";
import PollModals from "./modal/PollModals";

SplashScreen.preventAutoHideAsync();

const GroupPollDisplay = () => {
  const route = useRoute();
  const { groupId } = route.params;
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const { loaded, fonterror } = useLoadFonts();
  const [group, setGroup] = useState(null);
  const [polls, setPolls] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [expandedPolls, setExpandedPolls] = useState({});
  const [groupMenuVisible, setGroupMenuVisible] = useState(false);
  const [pollMenuVisible, setPollMenuVisible] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isLoadingGroupUpdate, setIsLoadingGroupUpdate] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [dots, setDots] = useState("");
  const { getPollInteraction } = usePollInteractions(polls, showToast);
  const insets = useSafeAreaInsets();

  // Create Poll Modal State
  const [createPollVisible, setCreatePollVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [pollType, setPollType] = useState("public");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("minutes");
  const [hasDuration, setHasDuration] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Poll Modal State
  const [editPollVisible, setEditPollVisible] = useState(false);
  const [editPollId, setEditPollId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOptions, setEditOptions] = useState([]);
  const [newOptions, setNewOptions] = useState([]);
  const [newOption, setNewOption] = useState("");
  const [editPollType, setEditPollType] = useState("public");
  const [editDuration, setEditDuration] = useState("");
  const [editDurationUnit, setEditDurationUnit] = useState("minutes");
  const [editHasDuration, setEditHasDuration] = useState(true);
  const [editIsLoading, setEditIsLoading] = useState(false);
  const [confirmCloseVisible, setConfirmCloseVisible] = useState(false);

  // Edit Group Modal State
  const [editGroupVisible, setEditGroupVisible] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupLoading, setEditGroupLoading] = useState(false);
  const [deleteGroupLoading, setDeleteGroupLoading] = useState(false);

  if (!loaded && !fonterror) return null;

  // Fetch current user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("user_id");
        if (!userId) {
          showToast("error", "User not authenticated. Please log in.");
          navigation.navigate("Login");
          return;
        }
        const parsedUserId = parseInt(userId, 10);
        console.log("Fetched Current User ID:", parsedUserId);
        setCurrentUserId(parsedUserId);
      } catch (error) {
        console.error("Error fetching user ID:", error);
        showToast("error", "Failed to fetch user ID");
        navigation.navigate("Login");
      }
    };
    getUserId();
  }, []);

  // Fetch group and polls
  const fetchGroupAndPolls = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        showToast("error", "Please log in to access this group");
        navigation.navigate("Login");
        return;
      }
      const API_URL = `http://192.168.1.8:8000/api/group-poll/${groupId}`;
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });
      if (response.data.success) {
        const groupData = response.data.group;
        const pollsData = response.data.polls || [];
        console.log("API Response - Group:", groupData);
        console.log("API Response - Polls:", pollsData);

        const updatedGroup = {
          ...groupData,
          isCreatedByMe:
            currentUserId && groupData.user?.id
              ? currentUserId === groupData.user.id
              : false,
        };
        console.log(
          "Derived isCreatedByMe for Group:",
          updatedGroup.isCreatedByMe
        );

        const updatedPolls = pollsData.map((poll) => ({
          ...poll,
          isCreatedByMe:
            currentUserId && poll.user?.id
              ? currentUserId === poll.user.id
              : false,
          choices: Array.isArray(poll.choices) ? poll.choices : [],
        }));
        console.log(
          "Derived isCreatedByMe for Polls:",
          updatedPolls.map((p) => p.isCreatedByMe)
        );

        setGroup(updatedGroup);
        setPolls(updatedPolls);
        setEditGroupName(groupData.groupName);
      } else {
        showToast(
          "error",
          response.data.message || "Failed to fetch group data"
        );
      }
    } catch (error) {
      console.error("Fetch Group Error:", error.response?.data || error);
      const errorMessage =
        error.response?.status === 401
          ? "Authentication required. Please log in."
          : error.response?.data?.message || "Failed to connect to server";
      showToast("error", errorMessage);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroupAndPolls().then(() => {
      if (loaded) {
        SplashScreen.hideAsync();
      }
    });
  }, [groupId, currentUserId, loaded]);

  // Loading dots animation
  useEffect(() => {
    let interval;
    if (isLoadingGroupUpdate) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length < 4 ? prev + "." : ""));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isLoadingGroupUpdate]);

  // Create Poll modal
  const handleCreatePoll = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        showToast("error", "Please log in to create a poll");
        navigation.navigate("Login");
        return;
      }
      if (!currentUserId) {
        showToast("error", "User not authenticated. Please log in.");
        navigation.navigate("Login");
        return;
      }
      if (!groupId) {
        showToast("error", "Invalid group ID");
        return;
      }

      const validOptions = options.filter((opt) => opt.trim() !== "");
      if (!title.trim()) {
        showToast("error", "Poll title is required");
        return;
      }
      if (validOptions.length < 2) {
        showToast("error", "At least two non-empty options are required");
        return;
      }
      if (hasDuration && (duration === "" || parseInt(duration, 10) < 1)) {
        showToast("error", "Duration must be at least 1");
        return;
      }

      const durationInMinutes = hasDuration
        ? durationUnit === "minutes"
          ? parseInt(duration, 10)
          : durationUnit === "hours"
          ? parseInt(duration, 10) * 60
          : durationUnit === "days"
          ? parseInt(duration, 10) * 24 * 60
          : 0
        : null;

      const payload = {
        group_poll_id: groupId,
        user_id: currentUserId,
        title: title.trim(),
        description: description.trim() || "",
        choices: validOptions,
        duration: durationInMinutes,
        type: pollType,
      };

      console.log("Create Poll Payload:", payload);

      const response = await axios.post(
        `http://192.168.1.8:8000/api/storeGpoll`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      console.log("Create Poll Response:", response.data);

      if (response.data.success) {
        showToast(
          "success",
          response.data.message || "Poll created successfully"
        );
        setCreatePollVisible(false);
        resetForm();
        await fetchGroupAndPolls();
      } else {
        showToast("error", response.data.message || "Failed to create poll");
      }
    } catch (error) {
      console.error("Error creating poll:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.errors?.join(", ") ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to create poll";
      showToast("error", errorMessage);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form after poll creation
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOptions(["", ""]);
    setDuration("");
    setDurationUnit("minutes");
    setHasDuration(true);
    setPollType("public");
  };

  // Voting function
  const handleVote = async (pollId, choiceId) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        showToast("error", "Please log in to vote");
        navigation.navigate("Login");
        return;
      }
      const response = await axios.post(
        `http://192.168.1.8:8000/api/voteGPoll`,
        {
          g_poll_id: pollId,
          option_id: choiceId,
          user_id: currentUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        showToast(
          "success",
          response.data.message || "Vote processed successfully"
        );
        setPolls((prevPolls) =>
          prevPolls.map((poll) =>
            poll.id === pollId
              ? {
                  ...poll,
                  totalVotes: response.data.total_votes,
                  choices: Array.isArray(poll.choices)
                    ? poll.choices.map((choice) => {
                        const result = response.data.results.find(
                          (r) => r.option_id === choice.id
                        );
                        return {
                          ...choice,
                          percentage: result
                            ? result.percentage
                            : choice.percentage,
                        };
                      })
                    : [],
                }
              : poll
          )
        );
      } else {
        showToast("error", response.data.message || "Failed to process vote");
      }
    } catch (error) {
      console.error("Vote Error:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to connect to server";
      showToast("error", errorMessage);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    }
  };

  // Handle group edit
  const handleEditGroup = () => {
    setGroupMenuVisible(false);
    setEditGroupVisible(true);
  };

  const handleUpdateGroup = async () => {
    try {
      setEditGroupLoading(true);
      setIsLoadingGroupUpdate(true);
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        showToast("error", "Please log in to update group");
        navigation.navigate("Login");
        return;
      }
      const payload = {
        user_id: currentUserId,
        groupName: editGroupName.trim(),
      };

      console.log("Update Group Payload:", payload);

      const response = await axios.post(
        `http://192.168.1.8:8000/api/updateGroupPoll/${groupId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        showToast(
          "success",
          response.data.message || "Group updated successfully"
        );
        setEditGroupVisible(false);
        await fetchGroupAndPolls();
        setSuccessModalVisible(true);
      } else {
        showToast("error", response.data.message || "Failed to update group");
      }
    } catch (error) {
      console.error("Update Group Error:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to update group";
      showToast("error", errorMessage);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setEditGroupLoading(false);
      setIsLoadingGroupUpdate(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setDeleteGroupLoading(true);
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        Toast.show({ type: "error", text1: "Please log in to delete group" });
        navigation.navigate("Login");
        return;
      }
      const response = await axios.delete(
        `http://192.168.1.8:8000/api/deleteGroupPoll/${groupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      Toast.show({
        type: "success",
        text1: response.data.message || "Group deleted successfully",
      });
      navigation.navigate("GroupHome");
    } catch (error) {
      console.error("Delete Group Error:", error.response?.data || error);
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Failed to delete group",
      });
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setDeleteGroupLoading(false);
      setConfirmDeleteVisible(false);
    }
  };

  // Handle poll edit and delete
  const handleEditPoll = (poll) => {
    setPollMenuVisible(null);
    setEditPollId(poll.id);
    setEditTitle(poll.title || "");
    setEditDescription(poll.description || "");
    setEditOptions(
      Array.isArray(poll.choices)
        ? poll.choices.map((choice) => choice.option_text || "")
        : []
    );
    setNewOptions([]); // Reset new options
    setNewOption(""); // Reset new option input
    setEditPollType(poll.type || "public");
    if (poll.duration) {
      let durationValue = poll.duration;
      let unit = "minutes";
      if (durationValue >= 24 * 60) {
        durationValue = Math.floor(durationValue / (24 * 60));
        unit = "days";
      } else if (durationValue >= 60) {
        durationValue = Math.floor(durationValue / 60);
        unit = "hours";
      }
      setEditDuration(durationValue.toString());
      setEditDurationUnit(unit);
      setEditHasDuration(true);
    } else {
      setEditDuration("");
      setEditHasDuration(false);
    }
    setEditPollVisible(true);
  };

  const addEditOption = () => {
    if (newOption.trim() && editOptions.length + newOptions.length < 6) {
      setNewOptions((prev) => [...prev, newOption.trim()]);
      setNewOption(""); // Clear input after adding
    }
  };

  const handleUpdatePollWithNewOption = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        showToast("error", "Please log in to update poll");
        navigation.navigate("Login");
        return;
      }

      // Collect all new options, including the current newOption if non-empty
      const optionsToSubmit = [...newOptions];
      if (newOption.trim()) {
        optionsToSubmit.push(newOption.trim());
      }

      if (!optionsToSubmit.length) {
        showToast("error", "No new options to add");
        return;
      }

      const payload = {
        new_options: optionsToSubmit,
      };

      console.log("Add Poll Options Payload:", payload);

      setEditIsLoading(true);
      const response = await axios.post(
        `http://192.168.1.8:8000/api/add-poll-option/${editPollId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        showToast(
          "success",
          response.data.message || "Options added successfully"
        );
        setEditPollVisible(false);
        resetEditForm();
        await fetchGroupAndPolls();
      } else {
        showToast("error", response.data.message || "Failed to add options");
      }
    } catch (error) {
      console.error("Add Poll Options Error:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to add options";
      showToast("error", errorMessage);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    } finally {
      setEditIsLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    if (newOption.trim() || newOptions.length > 0) {
      setConfirmCloseVisible(true);
    } else {
      setEditPollVisible(false);
      resetEditForm();
    }
  };

  const handleDeletePoll = async (pollId) => {
    setPollMenuVisible(null);
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        showToast("error", "Please log in to delete poll");
        navigation.navigate("Login");
        return;
      }
      await axios.delete(`http://192.168.1.8:8000/api/delete-poll/${pollId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });
      showToast("success", "Poll deleted successfully");
      setPolls((prevPolls) => prevPolls.filter((poll) => poll.id !== pollId));
    } catch (error) {
      console.error("Delete Poll Error:", error.response?.data || error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete poll";
      showToast("error", errorMessage);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    }
  };

  // Toggle poll dropdown
  const togglePollDropdown = (pollId) => {
    setExpandedPolls((prev) => ({ ...prev, [pollId]: !prev[pollId] }));
  };

  const resetEditForm = () => {
    setEditPollId(null);
    setEditTitle("");
    setEditDescription("");
    setEditOptions([]);
    setNewOptions([]);
    setNewOption("");
    setEditDuration("");
    setEditDurationUnit("minutes");
    setEditHasDuration(true);
    setEditPollType("public");
  };

  const refreshControlTintColor = theme === "dark" ? "#60B8FF" : "#333333";
  const refreshControlColors = theme === "dark" ? ["#60B8FF"] : ["#50A8EE"];
  const progressBackgroundColor = theme === "dark" ? "#2A2A2A" : "#F5F5F7";

  if (!group) {
    return (
      <View
        className={`flex-1 justify-center items-center ${
          theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"
        }`}
      >
        <ActivityIndicator size="large" color="#50A8EE" />
      </View>
    );
  }

  return (
    <View
      className={`flex-1 px-1 h-full ${
        theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#F5F5F7]"
      }`}
    >
      {/* Custom Header */}
      <View
        className={`flex-row items-center justify-between px-3 py-5 ${
          theme === "dark"
            ? "bg-[#1A1A1A] border-none"
            : "bg-[#F5F5F7] border-b border-[#dee2e6]"
        }`}
        style={{ paddingTop: insets.top + 10 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-left"
            size={24}
            color={theme === "dark" ? "#60B8FF" : "#50A8EE"}
          />
        </TouchableOpacity>
        <Text
          className={`text-[22px] tracking-wider ${
            theme === "dark" ? "text-white" : "text-[#50A8EE]"
          }`}
          style={{ fontFamily: "Raleway-Black" }}
        >
          Group Polls
        </Text>
        {group.isCreatedByMe && (
          <TouchableOpacity onPress={() => setGroupMenuVisible(true)}>
            <Icon
              name="dots-vertical"
              size={24}
              color={theme === "dark" ? "#60B8FF" : "#50A8EE"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Group Menu */}
      {groupMenuVisible && (
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setGroupMenuVisible(false)}
          />
          <View
            style={{ position: "absolute", right: 10, top: insets.top + 10 }}
          >
            <Menu
              visible={groupMenuVisible}
              anchor={<View />}
              onRequestClose={() => setGroupMenuVisible(false)}
              style={{
                backgroundColor: theme === "dark" ? "#2A2A2A" : "#FFFFFF",
                width: 150,
              }}
            >
              <MenuItem
                onPress={handleEditGroup}
                textStyle={{
                  color: theme === "dark" ? "#FFFFFF" : "#000000",
                  fontFamily: "OpenSans-Regular",
                }}
              >
                Edit Group
              </MenuItem>
              <MenuItem
                onPress={() => {
                  console.log("Delete Group menu item pressed");
                  setGroupMenuVisible(false);
                  setConfirmDeleteVisible(true);
                }}
                textStyle={{ color: "#FF5555", fontFamily: "OpenSans-Regular" }}
              >
                Delete Group
              </MenuItem>
            </Menu>
          </View>
        </View>
      )}

      {/* Group Header */}
      <View className="px-5 py-2">
        <View className="flex-row items-center py-2 mt-2">
          <Image
            source={require("../../assets/images/default-avatar.webp")}
            className="w-[35px] h-[35px] rounded-full mr-2"
            onError={(e) =>
              console.log("Image load error:", e.nativeEvent.error)
            }
          />
          <View className="flex-col">
            <Text
              className={`text-[12px] tracking-wide ${
                theme === "dark" ? "text-white" : "text-black"
              }`}
              style={{ fontFamily: "OpenSans-Black" }}
            >
              {currentUserId &&
              group.user?.id &&
              currentUserId === group.user.id
                ? "By Me"
                : group.user?.username || "Unknown"}
            </Text>
            <Text
              className={`text-[11px] tracking-normal ${
                theme === "dark" ? "text-[#ccc]" : "text-[#555]"
              }`}
              style={{ fontFamily: "OpenSans-Regular" }}
            >
              Created {moment(group.created_at).fromNow()}
            </Text>
          </View>
        </View>
        <Text
          className={`text-[20px] tracking-wide mt-2 ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
          style={{ fontFamily: "OpenSans-SemiBold" }}
        >
          {group.groupName}
        </Text>
        <Text
          className={`text-[12px] tracking-wide mt-1 ${
            theme === "dark" ? "text-[#ccc]" : "text-[#555]"
          }`}
          style={{ fontFamily: "OpenSans-Semibold" }}
        >
          {group?.type === "public" ? "Public Group" : "Private Group"}
        </Text>
        <Text
          className={`text-[12px] tracking-wide mt-1 ${
            theme === "dark" ? "text-[#50A8EE]" : "text-[#50A8EE]"
          }`}
          style={{ fontFamily: "OpenSans-Black" }}
        >
          {group.totalPolls || 0} {group.totalPolls === 1 ? "poll" : "polls"}
        </Text>
      </View>

      {/* Polls List */}
      <ScrollView
        className="w-full px-5 mt-5"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchGroupAndPolls}
            tintColor={refreshControlTintColor}
            colors={refreshControlColors}
            progressBackgroundColor={progressBackgroundColor}
          />
        }
      >
        {polls.length > 0 ? (
          polls.map((poll, index) => {
            const {
              voteData: {
                selectedOption,
                voteResults,
                totalVotes,
                votingDisabled,
              },
            } = getPollInteraction(poll.id);
            return (
              <View key={poll.id || index} className="mb-5">
                <View
                  className={`p-4 rounded-lg shadow-xl elevation-7 ${
                    theme === "dark"
                      ? "bg-[#262626]"
                      : "bg-white shadow-black/50"
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                      className="flex-1"
                      onPress={() => togglePollDropdown(poll.id)}
                    >
                      <Text
                        className={`text-[20px] tracking-wide ${
                          theme === "dark" ? "text-white" : "text-black"
                        }`}
                        style={{ fontFamily: "OpenSans-SemiBold" }}
                        numberOfLines={2}
                        ellipsizeMode="head"
                      >
                        {poll.title}
                      </Text>
                    </TouchableOpacity>
                    <View className="flex-row items-center">
                      <Text
                        className="text-[11px] text-[#50A8EE] tracking-tight text-center mr-2"
                        style={{ fontFamily: "OpenSans-Black" }}
                      >
                        {totalVotes || 0} {totalVotes === 1 ? "vote" : "votes"}
                      </Text>
                      <TouchableOpacity
                        onPress={() => togglePollDropdown(poll.id)}
                      >
                        <Icon
                          name={
                            expandedPolls[poll.id]
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          color={theme === "dark" ? "#fff" : "#555"}
                        />
                      </TouchableOpacity>
                      {poll.isCreatedByMe && (
                        <TouchableOpacity
                          onPress={() => setPollMenuVisible(poll.id)}
                          className="ml-2"
                        >
                          <Icon
                            name="dots-vertical"
                            size={20}
                            color={theme === "dark" ? "#fff" : "#555"}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Poll Menu */}
                {pollMenuVisible === poll.id && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      activeOpacity={1}
                      onPress={() => setPollMenuVisible(null)}
                    />
                    <View
                      style={{
                        position: "absolute",
                        right: 10,
                        top: insets.top + 70 + index * 120,
                      }}
                    >
                      <Menu
                        visible={pollMenuVisible === poll.id}
                        anchor={<View />}
                        onRequestClose={() => setPollMenuVisible(null)}
                        style={{
                          backgroundColor:
                            theme === "dark" ? "#2A2A2A" : "#FFFFFF",
                          width: 150,
                        }}
                      >
                        <MenuItem
                          onPress={() => handleEditPoll(poll)}
                          textStyle={{
                            color: theme === "dark" ? "#FFFFFF" : "#000000",
                            fontFamily: "OpenSans-Regular",
                          }}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          onPress={() => handleDeletePoll(poll.id)}
                          textStyle={{
                            color: "#FF5555",
                            fontFamily: "OpenSans-Regular",
                          }}
                        >
                          Delete
                        </MenuItem>
                      </Menu>
                    </View>
                  </View>
                )}

                {/* Poll Choices Dropdown */}
                {expandedPolls[poll.id] && (
                  <View className="mt-2 mx-4">
                    {Array.isArray(poll.choices) && poll.choices.length > 0 ? (
                      poll.choices.map((choice) => {
                        const votePercentage =
                          voteResults.find(
                            (result) => result.option_id === choice.id
                          )?.percentage || 0;
                        const isSelected = selectedOption === choice.id;
                        return (
                          <TouchableOpacity
                            key={choice.id}
                            className={`relative border rounded-[10px] h-[60px] my-1 overflow-hidden ${
                              isSelected
                                ? theme === "dark"
                                  ? "border-[#60B8FF]"
                                  : "border-[#50A8EE]"
                                : theme === "dark"
                                ? "border-[#fff]"
                                : "border-[#ccc]"
                            } ${votingDisabled && "opacity-50"}`}
                            onPress={() => handleVote(poll.id, choice.id)}
                            disabled={votingDisabled}
                          >
                            <View
                              className="absolute inset-0"
                              style={{
                                width: `${votePercentage}%`,
                                backgroundColor: isSelected
                                  ? theme === "dark"
                                    ? "rgba(96, 184, 255, 0.3)"
                                    : "rgba(80, 168, 238, 0.3)"
                                  : theme === "dark"
                                    ? "rgba(170, 170, 170, 0.3)"
                                    : "rgba(204, 204, 204, 0.3)",
                              }}
                            />
                            <View className="flex-row justify-between items-center px-2.5 py-5 z-10">
                              <Text
                                className={`flex-1 text-[14px] tracking-wide ${
                                  isSelected
                                    ? theme === "dark"
                                      ? "text-[#60B8FF]"
                                      : "text-[#50A8EE]"
                                    : theme === "dark"
                                    ? "text-[#fff]"
                                    : "text-[#555]"
                                }`}
                                style={{ fontFamily: "OpenSans-Medium" }}
                              >
                                {choice.option_text}
                              </Text>
                              <Text
                                className={`text-[14px] tracking-tight px-2.5 ${
                                  isSelected
                                    ? theme === "dark"
                                      ? "text-[#60B8FF]"
                                      : "text-[#50A8EE]"
                                    : theme === "dark"
                                    ? "text-[#fff]"
                                    : "text-[#555]"
                                }`}
                                style={{ fontFamily: "OpenSans-Medium" }}
                              >
                                {votePercentage}%
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text
                        className={`text-[14px] tracking-wide text-center ${
                          theme === "dark" ? "text-[#ccc]" : "text-[#555]"
                        }`}
                        style={{ fontFamily: "OpenSans-Medium" }}
                      >
                        No choices available.
                      </Text>
                    )}
                    <View className="flex-row items-center justify-between mt-4">
                      <View className="flex-row items-center">
                        <Icon
                          name="poll"
                          size={19}
                          color={theme === "dark" ? "#ccc" : "#555"}
                          className="mr-1.5"
                        />
                        <Text
                          className={`text-[13px] tracking-wide ${
                            theme === "dark" ? "text-white" : "text-black"
                          }`}
                          style={{ fontFamily: "OpenSans-Medium" }}
                        >
                          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text
            className="text-center mt-12 text-lg text-[#555]"
            style={{ fontFamily: "Inter-Medium" }}
          >
            No polls available.
          </Text>
        )}
      </ScrollView>

      {/* Loading Modal */}
      {isLoadingGroupUpdate && (
        <Modal transparent={true} animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="w-3/5 items-center">
              <ActivityIndicator size="large" color="#6666FF" />
              <View className="flex-row items-center justify-center gap-1">
                <Text
                  className="text-white text-[15px] tracking-wide"
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  {confirmDeleteVisible ? "Deleting group" : "Updating group"}
                </Text>
                <Text className="text-[#6666FF] text-[18px] tracking-wide">
                  {dots}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Success Modal */}
      <Modal
        transparent={true}
        visible={successModalVisible}
        animationType="slide"
        onRequestClose={() => {
          console.log("Success modal close requested");
          setSuccessModalVisible(false);
        }}
      >
        <View
          className={`flex-1 justify-end ${
            theme === "dark" ? "bg-black/50" : "bg-black/50"
          }`}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              console.log("Background clicked to close success modal");
              setSuccessModalVisible(false);
            }}
          />
          <View
            className={`rounded-t-3xl p-5 ${
              theme === "dark" ? "bg-[#262626]" : "bg-white"
            }`}
          >
            <View className="flex-row items-center justify-center gap-2.5 mt-2.5 mb-5">
              <Icon name="check-circle" size={20} color="green" />
              <Text
                className={`text-[14px] tracking-normal ${
                  theme === "dark" ? "text-white" : "text-black"
                }`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Your Group Has Been Updated
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              className="bg-[#6666FF] rounded-xl p-3 items-center"
              onPress={() => {
                console.log("Back to Home button pressed");
                try {
                  setSuccessModalVisible(false);
                  navigation.navigate("GroupHome");
                } catch (error) {
                  console.error("Navigation error:", error);
                  showToast("error", "Failed to navigate to Group Home");
                }
              }}
            >
              <Text
                className="text-white text-[14px] tracking-normal"
                style={{ fontFamily: "OpenSans-Regular" }}
              >
                Back to Home
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              className="mt-2 p-2"
              onPress={() => {
                console.log("Close button pressed");
                setSuccessModalVisible(false);
              }}
            >
              <Text
                className={`text-[14px] tracking-normal text-center ${
                  theme === "dark" ? "text-blue-400" : "text-blue-600"
                }`}
                style={{ fontFamily: "OpenSans-Medium" }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Poll Modals */}
      <PollModals
        theme={theme}
        createPollVisible={createPollVisible}
        setCreatePollVisible={setCreatePollVisible}
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        options={options}
        setOptions={setOptions}
        pollType={pollType}
        setPollType={setPollType}
        duration={duration}
        setDuration={setDuration}
        durationUnit={durationUnit}
        setDurationUnit={setDurationUnit}
        hasDuration={hasDuration}
        setHasDuration={setHasDuration}
        isLoading={isLoading}
        handleCreatePoll={handleCreatePoll}
        editGroupVisible={editGroupVisible}
        setEditGroupVisible={setEditGroupVisible}
        editGroupName={editGroupName}
        setEditGroupName={setEditGroupName}
        editGroupLoading={editGroupLoading}
        handleUpdateGroup={handleUpdateGroup}
        editPollVisible={editPollVisible}
        setEditPollVisible={setEditPollVisible}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editOptions={editOptions}
        setEditOptions={setEditOptions}
        newOptions={newOptions}
        setNewOptions={setNewOptions}
        newOption={newOption}
        setNewOption={setNewOption}
        editPollType={editPollType}
        setEditPollType={setEditPollType}
        editDuration={editDuration}
        setEditDuration={setEditDuration}
        editDurationUnit={editDurationUnit}
        setEditDurationUnit={setEditDurationUnit}
        editHasDuration={editHasDuration}
        setEditHasDuration={setEditHasDuration}
        editIsLoading={editIsLoading}
        handleUpdatePollWithNewOption={handleUpdatePollWithNewOption}
        addEditOption={addEditOption}
        handleCloseEditModal={handleCloseEditModal}
        confirmCloseVisible={confirmCloseVisible}
        setConfirmCloseVisible={setConfirmCloseVisible}
        confirmDeleteVisible={confirmDeleteVisible}
        setConfirmDeleteVisible={setConfirmDeleteVisible}
        handleDeleteGroup={handleDeleteGroup}
        resetEditForm={resetEditForm}
        deleteGroupLoading={deleteGroupLoading}
      />

      {/* Trigger Button */}
      <TouchableOpacity
        className={`absolute bottom-5 right-5 w-14 h-14 rounded-full ${
          theme === "dark" ? "bg-[#4a4aff]" : "bg-[#6666FF]"
        } items-center justify-center shadow-lg`}
        onPress={() => setCreatePollVisible(true)}
      >
        <Icon name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      <Toast config={toastConfig} />
    </View>
  );
};

export default GroupPollDisplay;