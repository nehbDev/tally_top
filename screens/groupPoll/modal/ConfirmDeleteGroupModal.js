import React from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PropTypes from "prop-types";

const ConfirmDeleteGroupModal = ({
  theme,
  confirmDeleteVisible,
  setConfirmDeleteVisible,
  handleDeleteGroup,
  deleteGroupLoading,
}) => {
  return (
    <Modal
      transparent={true}
      visible={confirmDeleteVisible}
      animationType="none"
      onRequestClose={() => {
        console.log("Confirm Delete Group Modal close requested");
        setConfirmDeleteVisible(false);
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          console.log("Confirm Delete Group Modal background clicked");
          setConfirmDeleteVisible(false);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`w-full p-6 rounded-t-3xl ${theme === "dark" ? "bg-[#262626]" : "bg-white"}`}>
            <Text
              className={`text-[14px] tracking-wide mb-3 ${theme === "dark" ? "text-white" : "text-black"}`}
              style={{ fontFamily: "OpenSans-SemiBold" }}
            >
              Are you sure you want to delete this group?
            </Text>
            <Text
              className={`text-[14px] tracking-wide mb-10 ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
              style={{ fontFamily: "OpenSans-Regular" }}
            >
              This action cannot be undone.
            </Text>
            <View className="flex-row gap-2 justify-between">
              <TouchableOpacity
                onPress={() => {
                  console.log("Cancel Delete Group button pressed");
                  setConfirmDeleteVisible(false);
                }}
                className="flex-1 border border-[#F44336] p-2 rounded-lg"
              >
                <Text
                  className={`text-[13px] tracking-wide text-center ${theme === "dark" ? "text-white" : "text-black"}`}
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  console.log("Delete Group button pressed");
                  handleDeleteGroup();
                }}
                className={`flex-1 bg-[#4CAF50] p-2 rounded-lg ${deleteGroupLoading ? "opacity-50" : "opacity-100"}`}
                disabled={deleteGroupLoading}
              >
                <Text
                  className="text-white text-[14px] tracking-wide text-center"
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  {deleteGroupLoading ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

ConfirmDeleteGroupModal.propTypes = {
  theme: PropTypes.oneOf(["light", "dark"]).isRequired,
  confirmDeleteVisible: PropTypes.bool.isRequired,
  setConfirmDeleteVisible: PropTypes.func.isRequired,
  handleDeleteGroup: PropTypes.func.isRequired,
  deleteGroupLoading: PropTypes.bool.isRequired,
};

export default ConfirmDeleteGroupModal;