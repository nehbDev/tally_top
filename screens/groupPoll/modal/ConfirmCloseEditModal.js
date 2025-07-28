import React from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PropTypes from "prop-types";

const ConfirmCloseEditModal = ({
  theme,
  confirmCloseVisible,
  setConfirmCloseVisible,
  setEditPollVisible,
  resetEditForm,
  setNewOption,
}) => {
  return (
    <Modal
      transparent={true}
      visible={confirmCloseVisible}
      animationType="none"
      onRequestClose={() => {
        console.log("Confirm Close Edit Modal close requested");
        setConfirmCloseVisible(false);
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          console.log("Confirm Close Edit Modal background clicked");
          setConfirmCloseVisible(false);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`w-full p-6 rounded-t-3xl ${theme === "dark" ? "bg-[#262626]" : "bg-white"}`}>
            <Text
              className={`text-[14px] tracking-wide mb-3 ${theme === "dark" ? "text-white" : "text-black"}`}
              style={{ fontFamily: "OpenSans-SemiBold" }}
            >
              Do you want to stop editing your poll?
            </Text>
            <Text
              className={`text-[14px] tracking-wide mb-10 ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
              style={{ fontFamily: "OpenSans-Regular" }}
            >
              If you stop now, you’ll lose any progress you made.
            </Text>
            <View className="flex-row gap-2 justify-between">
              <TouchableOpacity
                onPress={() => {
                  console.log("Stop Editing Poll button pressed");
                  setConfirmCloseVisible(false);
                  setEditPollVisible(false);
                  resetEditForm();
                  setNewOption("");
                }}
                className="flex-1 border border-[#F44336] p-2 rounded-lg"
              >
                <Text
                  className={`text-[13px] tracking-wide text-center ${theme === "dark" ? "text-white" : "text-black"}`}
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  Stop
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  console.log("Continue Editing Poll button pressed");
                  setConfirmCloseVisible(false);
                }}
                className="flex-1 bg-[#4CAF50] p-2 rounded-lg"
              >
                <Text
                  className="text-white text-[14px] tracking-wide text-center"
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

ConfirmCloseEditModal.propTypes = {
  theme: PropTypes.oneOf(["light", "dark"]).isRequired,
  confirmCloseVisible: PropTypes.bool.isRequired,
  setConfirmCloseVisible: PropTypes.func.isRequired,
  setEditPollVisible: PropTypes.func.isRequired,
  resetEditForm: PropTypes.func.isRequired,
  setNewOption: PropTypes.func.isRequired,
};

export default ConfirmCloseEditModal;