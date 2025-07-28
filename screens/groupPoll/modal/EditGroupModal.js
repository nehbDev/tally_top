import React from "react";
import { View, Text, TouchableOpacity, TextInput, Modal, TouchableWithoutFeedback } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PropTypes from "prop-types";

const EditGroupModal = ({
  theme,
  editGroupVisible,
  setEditGroupVisible,
  editGroupName,
  setEditGroupName,
  editGroupLoading,
  handleUpdateGroup,
}) => {
  return (
    <Modal
      transparent={true}
      visible={editGroupVisible}
      animationType="slide"
      onRequestClose={() => {
        console.log("Edit Group Modal close requested");
        setEditGroupVisible(false);
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          console.log("Edit Group Modal background clicked");
          setEditGroupVisible(false);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-3xl p-5 ${theme === "dark" ? "bg-[#262626]" : "bg-white"}`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className={`text-[20px] tracking-wide ${theme === "dark" ? "text-white" : "text-[#4CAF50]"}`}
                style={{ fontFamily: "OpenSans-Bold" }}
              >
                Edit Group
              </Text>
              <TouchableOpacity
                onPress={() => {
                  console.log("Edit Group Modal close button pressed");
                  setEditGroupVisible(false);
                }}
              >
                <Icon name="close" size={24} color={theme === "dark" ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>
            <TextInput
              className={`border-b rounded-lg h-12 mb-4 text-[13px] tracking-wide ${theme === "dark" ? "border-[#444] text-white" : "border-[#ccc] text-black"}`}
              value={editGroupName}
              onChangeText={setEditGroupName}
              placeholder="Enter group name..."
              placeholderTextColor={theme === "dark" ? "#ccc" : "#666"}
              style={{ fontFamily: "OpenSans-Medium" }}
              maxLength={60}
            />
            <View className="flex-row justify-between mb-2">
              <TouchableOpacity
                className={`bg-[#4CAF50] rounded-lg p-3 flex-1 mr-2 ${editGroupLoading ? "opacity-50" : "opacity-100"}`}
                onPress={() => {
                  console.log("Update Group button pressed");
                  handleUpdateGroup();
                }}
                disabled={editGroupLoading || !editGroupName.trim()}
              >
                <Text
                  className="text-white text-[14px] tracking-wide text-center"
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  {editGroupLoading ? "Updating..." : "Update Group"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-[#F44336] rounded-lg p-3 flex-1"
                onPress={() => {
                  console.log("Cancel Edit Group button pressed");
                  setEditGroupVisible(false);
                }}
              >
                <Text
                  className={`text-[14px] tracking-wide text-center ${theme === "dark" ? "text-white" : "text-black"}`}
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

EditGroupModal.propTypes = {
  theme: PropTypes.oneOf(["light", "dark"]).isRequired,
  editGroupVisible: PropTypes.bool.isRequired,
  setEditGroupVisible: PropTypes.func.isRequired,
  editGroupName: PropTypes.string.isRequired,
  setEditGroupName: PropTypes.func.isRequired,
  editGroupLoading: PropTypes.bool.isRequired,
  handleUpdateGroup: PropTypes.func.isRequired,
};

export default EditGroupModal;