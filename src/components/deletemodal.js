import React from "react";
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import axios from 'axios';
import { showToast } from "../utils/toastconfig";

const DeletePollModal = ({
    visible,
    onClose,
    pollId,
    navigation,
    theme,
  }) => {
    const handleDeletePoll = async () => {
      try {
        console.log("Delete confirmed, sending request for poll ID:", pollId);
        const response = await axios.post(`http://192.168.0.55:8002/api/polls/${pollId}/delete`);
        console.log("Delete response:", response.data);
        showToast("success", "Poll deleted successfully!");
        onClose();
        navigation.navigate("HomeScreen");
      } catch (error) {
        console.error("Delete error:", error.response?.data || error.message);
        showToast("error", "Failed to delete poll");
      }
    };
  
    return (
      <Modal
        transparent={true}
        visible={visible}
        animationType="none"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/50">
          <TouchableOpacity
            className="flex-1 w-full justify-end items-center"
            activeOpacity={1}
            onPress={onClose}
          >
            <View
              className={`w-full p-6 rounded-t-3xl ${theme === "dark" ? "bg-[#262626]" : "bg-[#FFFFFF]"}`}
            >
              <Text
                className={`text-[14px] tracking-wide mb-3 ${theme === "dark" ? "text-white" : "text-black"}`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Are you sure you want to delete this poll?
              </Text>
              <Text
                className={`text-[14px] tracking-wide mb-10 ${theme === "dark" ? "text-[#ccc]" : "text-black"}`}
                style={{ fontFamily: "OpenSans-Regular" }}
              >
                This action cannot be undone.
              </Text>
              <View className="flex-row gap-2 justify-between">
                <TouchableOpacity
                  onPress={onClose} 
                  className="flex-1 border border-[#FF5555] p-2 rounded-lg"
                >
                  <Text
                    className={`text-[13px] tracking-wide text-center ${
                      theme === "dark" ? "text-white" : "text-black"
                    }`}
                    style={{ fontFamily: "OpenSans-Regular" }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeletePoll}
                  className="flex-1 bg-[#FF5555] p-2 rounded-lg"
                >
                  <Text
                    className="text-white text-[13px] tracking-wide text-center"
                    style={{ fontFamily: "OpenSans-Regular" }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };
  
  export default DeletePollModal;