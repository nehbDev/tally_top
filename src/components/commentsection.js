import React, { useContext, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  StyleSheet,
  Pressable,
  TouchableHighlight
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "./ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CommentSection = ({ pollId }) => {
  // console.log("CommentSection pollId:", pollId);
  const [modalVisible, setModalVisible] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentsData, setCommentsData] = useState([]);
  const [token, setToken] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [commentCount, setCommentCount] = useState(0);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [isReactMode, setIsReactMode] = useState(false);
  const { theme } = useContext(ThemeContext);
  const inputRef = useRef(null);
  const apiUrl = `http://192.168.1.21:8000/api/comments/${pollId}`;

  const emojiReactions = [
    { emoji: "👍", text: "Liked", color: "#0000FF" },
    { emoji: "❤️", text: "Love", color: "#FF0000" },
    { emoji: "😂", text: "Haha", color: "#FFD700" },
    { emoji: "😮", text: "Wow", color: "#FFA500" },
    { emoji: "😢", text: "Sad", color: "#FFFF00" },
    { emoji: "😡", text: "Angry", color: "#FF4500" },
  ];

  useEffect(() => {
    const getToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("auth_token");
        console.log("Retrieved Token:", storedToken);
        setToken(storedToken);
      } catch (error) {
        console.log("Error retrieving token:", error);
      }
    };
    getToken();
  }, []);

  useEffect(() => {
    if (token && pollId) {
      fetchComments();
      const interval = setInterval(fetchComments, 5000);
      return () => clearInterval(interval);
    }
  }, [token, pollId]);

  const fetchComments = async () => {
    if (!token || !pollId) return;
    try {
      const res = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetch Comments Response:", res.data);
      const comments = res.data || [];
      setCommentsData(comments);
      setCommentCount(comments.length);
    } catch (error) {
      console.log("Error fetching comments:", error.response?.data || error.message);
      setCommentsData([]);
      setCommentCount(0);
    }
  };

  const handleAddComment = async () => {
    console.log("Add comment triggered");
    if (!newComment.trim() || !token || !pollId) return;
    try {
      const payload = replyingTo
        ? { content: newComment, parent_id: replyingTo, poll_id: pollId }
        : { content: newComment, poll_id: pollId };
      const res = await axios.post("http://192.168.190.150:8000/api/comments", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Post Response:", res.data);
      setNewComment("");
      setReplyingTo(null);
      setSelectedCommentId(null);
      setIsReactMode(false);
      fetchComments();
    } catch (error) {
      console.log("Error posting:", error.response?.data || error.message);
    }
  };

  const handleLike = async (commentId, emoji) => {
    if (!token) return;
    try {
      const comment = commentsData.find((c) => c.id === commentId) ||
                     commentsData.flatMap((c) => c.replies).find((r) => r.id === commentId);
      const currentReaction = comment?.user_reaction;
      const reactionToSend = emoji || currentReaction || "👍";
      console.log("Handling like for comment/reply:", commentId, "with emoji:", reactionToSend);
      const res = await axios.post(
        `http://192.168.190.150:8000/api/comments/${commentId}/like`,
        { emoji: reactionToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Like Response:", res.data);
      setCommentsData((prev) => {
        const updatedComments = prev.map((comment) => {
          if (comment.id === commentId) {
            console.log("Updating comment", commentId, "with counts:", res.data.reaction_counts);
            return {
              ...comment,
              reaction_counts: res.data.reaction_counts,
              user_reaction: res.data.user_reaction,
            };
          }
          if (comment.replies.some((r) => r.id === commentId)) {
            console.log("Updating reply", commentId, "with counts:", res.data.reaction_counts);
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId
                  ? {
                      ...reply,
                      reaction_counts: res.data.reaction_counts,
                      user_reaction: res.data.user_reaction,
                    }
                  : reply
              ),
            };
          }
          return comment;
        });
        console.log("Updated Comments Data:", updatedComments);
        return updatedComments;
      });
      setIsReactMode(false);
      setSelectedCommentId(null);
    } catch (error) {
      console.log("Error liking:", error.response?.data || error.message);
      fetchComments();
    }
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleCommentPress = (commentId) => {
    const comment = commentsData.find((c) => c.id === commentId) ||
                   commentsData.flatMap((c) => c.replies).find((r) => r.id === commentId);
    if (!comment) return;

    if (selectedCommentId === commentId) {
      if (isReactMode) {
        setSelectedCommentId(null);
        setIsReactMode(false);
        setNewComment("");
      } else {
        setIsReactMode(true);
        setNewComment("");
        setReplyingTo(null);
      }
    } else {
      setSelectedCommentId(commentId);
      setIsReactMode(false);
      setReplyingTo(commentId);
      setNewComment(`@${comment.user?.username || "Unknown"} `);
      if (comment.replies && comment.replies.length > 0) {
        setExpandedReplies((prev) => ({
          ...prev,
          [commentId]: true,
        }));
      }
      inputRef.current?.focus();
    }
  };

  const handleReplyClick = (comment) => {
    setSelectedCommentId(comment.id);
    setIsReactMode(false);
    setReplyingTo(comment.id);
    setNewComment(`@${comment.user?.username || "Unknown"} `);
    if (comment.replies && comment.replies.length > 0) {
      setExpandedReplies((prev) => ({
        ...prev,
        [comment.id]: true,
      }));
    }
    inputRef.current?.focus();
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const now = new Date();
    const commentDate = new Date(dateString);
    if (isNaN(commentDate.getTime())) {
      console.log("Invalid date:", dateString);
      return "Unknown time";
    }
    const diffInSeconds = Math.floor((now - commentDate) / 1000);
    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
  };

  const getReactionTextAndColor = (commentId, userReaction) => {
    if (!userReaction) return { text: "Like", color: "#555" };
    const reaction = emojiReactions.find((r) => r.emoji === userReaction);
    return reaction ? { text: reaction.text, color: reaction.color } : { text: "Like", color: "#0000FF" };
  };

  const getTotalReactions = (reactionCounts) => {
    if (!reactionCounts) return 0;
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  };

  const renderComment = ({ item }) => {
    const isReply = item.parent_id !== null;
    const hasReplies = item.replies && item.replies.length > 0;
    const repliesVisible = expandedReplies[item.id];
    const { text: reactionText, color: reactionColor } = getReactionTextAndColor(item.id, item.user_reaction);
    
    const totalReactions = getTotalReactions(item.reaction_counts);
    return (
      <View className="py-2">
        <Pressable onPress={() => handleCommentPress(item.id)}>
          <View className="flex-row relative">
            <Image
              source={{
                uri: item.user?.avatar || "https://randomuser.me/api/portraits/men/4.jpg",
              }}
              className="w-9 h-9 rounded-full mr-3"
            />
            <View className="flex-1">
              <View className="flex-row items-start">
                <View className="rounded-lg py-1 px-2 flex-1">
                  <Text
                    className={`text-[13px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
                    style={{ fontFamily: "OpenSans-Regular" }}
                  >
                    {item.user?.username || "Unknown"}
                  </Text>
                  <Text
                    className={`text-[18px] tracking-wider ${theme === "dark" ? "text-white" : "text-black"}`}
                    style={{ fontFamily: "OpenSans-SemiBold" }}
                  >
                    {item.content}
                  </Text>
                </View>
              </View>
              <View className="mt-1.5">
                <View className="flex-row items-center gap-4">
                  <Text
                    className="text-[#555] text-[12px] tracking-wide"
                    style={{ fontFamily: "OpenSans-Medium" }}
                  >
                    {formatTimeAgo(item.created_at)}
                  </Text>
                  <TouchableHighlight onPress={() => handleLike(item.id)} underlayColor="white">
                    <Text
                      style={{ color: reactionColor, fontFamily: "OpenSans-Medium" }}
                      className="text-[12px] tracking-wide"
                    >
                      {reactionText}
                    </Text>
                  </TouchableHighlight>
                  {!isReply && (
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity onPress={() => handleReplyClick(item)}>
                        <Text
                          className="text-[#555] text-[12px] tracking-wide"
                          style={{ fontFamily: "OpenSans-Medium" }}
                        >
                          Reply
                        </Text>
                      </TouchableOpacity>
                      <Text
                        className="text-[#555] text-[12px] tracking-wide"
                        style={{ fontFamily: "OpenSans-Medium" }}
                      >
                        {totalReactions}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Pressable>

        {hasReplies && (
          <View className="ml-12 mt-2 relative">
            {repliesVisible && (
              <View
                style={{
                  position: "absolute",
                  left: -27,
                  top: -20,
                  width: 1,
                  height: "100%",
                  backgroundColor: "#ccc",
                }}
              />
            )}
            {!repliesVisible && (
              <TouchableOpacity onPress={() => toggleReplies(item.id)} className="mb-2">
                <Text
                  className="text-[#555] text-[12px] tracking-normal"
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  View {item.replies.length} more {item.replies.length === 1 ? "reply" : "replies"}
                </Text>
              </TouchableOpacity>
            )}
            {repliesVisible && (
              <FlatList
                data={item.replies}
                renderItem={({ item: reply }) => {
                  const { text: replyReactionText, color: replyReactionColor } = getReactionTextAndColor(
                    reply.id,
                    reply.user_reaction
                  );
                  return (
                    <Pressable onPress={() => handleCommentPress(reply.id)}>
                      <View className="flex-row mt-2 relative">
                        <Image
                          source={{
                            uri: reply.user?.avatar || "https://randomuser.me/api/portraits/lego/1.jpg",
                          }}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <View className="flex-1 mb-3">
                          <View className="flex-row items-start">
                            <View className="self-start flex-shrink-1 bg-[#F5F5F7] px-1 py-2 rounded-lg">
                              <Text
                                className="text-black text-[13px] tracking-wide"
                                style={{ fontFamily: "OpenSans-SemiBold" }}
                              >
                                {reply.user?.username || "Unknown"}
                              </Text>
                              <Text
                                className="text-black text-[17px] tracking-wider mt-1"
                                style={{ fontFamily: "OpenSans-SemiBold" }}
                              >
                                {reply.content}
                              </Text>
                            </View>
                          </View>
                          <View className="mt-1">
                            <View className="flex-row items-center gap-8">
                              <Text
                                className="text-[#555] text-[12px] tracking-wide"
                                style={{ fontFamily: "OpenSans-Medium" }}
                              >
                                {formatTimeAgo(reply.created_at)}
                              </Text>
                              <TouchableHighlight onPress={() => handleLike(reply.id)} underlayColor="white">
                                <Text
                                  style={{ color: replyReactionColor, fontFamily: "OpenSans-Medium" }}
                                  className="text-[12px] tracking-wide"
                                >
                                  {replyReactionText}
                                </Text>
                              </TouchableHighlight>
                            </View>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                }}
                keyExtractor={(reply) => reply.id.toString()}
              />
            )}
            {repliesVisible && (
              <TouchableOpacity onPress={() => toggleReplies(item.id)} className="mt-2">
                <Text
                  className="text-[#555] text-[12px] tracking-normal"
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  Hide replies
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };
    
    

  const renderReactionPicker = () => {
    if (!selectedCommentId) return null;
    return (
      <View className={`flex-row justify-around p-2 ${theme === "dark" ? "bg-[#2A2A2A]" : "bg-white"}`}>
        {emojiReactions.map(({ emoji }) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => handleLike(selectedCommentId, emoji)}
            className="mx-2"
          >
            <Text className="text-[25px]">{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderEmptyComments = () => (
    <View className="flex-1 justify-center items-center" style={{ height: SCREEN_HEIGHT * 0.6 }}>
      <Icon
        name="comment-off-outline"
        size={80}
        color={theme === "dark" ? "#888" : "#ccc"}
      />
      <Text
        className={`text-[18px] tracking-wide ${
          theme === "dark" ? "text-[#AAA]" : "text-[#555]"
        } text-center mt-5`}
        style={{ fontFamily: "Raleway-Bold" }}
      >
        No comments available
      </Text>
    </View>
  );

  return (
    <View>
      <TouchableHighlight 
      onPress={() => setModalVisible(true)} 
      underlayColor={theme === 'dark' ? '#555' : 'white'}>
        <View className="flex-row items-center gap-1">
          <Icon name="comment-text-outline" size={19} color={theme === "dark" ? "#ccc" : "#555"} />
          <Text className={`text-[13px] tracking-wide ${theme === "dark" ? "text-white" : "text-[#555]"}`}>
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'} 
          </Text>
        </View>
      </TouchableHighlight>

      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.bottomSheet,
                  { backgroundColor: theme === "dark" ? "#2A2A2A" : "white" },
                ]}
              >
                <View className="flex-row justify-between items-center mb-3 px-5">
                  <Text
                    className={`text-[15px] tracking-wider ${theme === "dark" ? "text-white" : "text-black"}`}
                    style={{ fontFamily: "OpenSans-Bold" }}
                  >
                    Comments {commentCount}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Icon name="chevron-down" size={24} color={theme === "dark" ? "white" : "black"} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={commentsData}
                  renderItem={renderComment}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
                  ListEmptyComponent={renderEmptyComments}
                />

                <View className="px-5">
                  {renderReactionPicker()}
                  <View className="flex-row items-center border-t border-gray-200 pt-2">
                    <Image
                      source={{ uri: "https://randomuser.me/api/portraits/men/4.jpg" }}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <TextInput
                      ref={inputRef}
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholder={
                        replyingTo && !isReactMode
                          ? `Reply to ${
                              commentsData.find((c) => c.id === replyingTo)?.user?.username || "Unknown"
                            }...`
                          : "Write a comment..."
                      }
                      placeholderTextColor="#999"
                      className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-black"
                      onSubmitEditing={handleAddComment}
                    />
                    <TouchableOpacity onPress={handleAddComment} className="ml-2">
                      <Icon name="send" size={20} color="#555" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    height: SCREEN_HEIGHT * 0.8, 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
  },
});

export default CommentSection;