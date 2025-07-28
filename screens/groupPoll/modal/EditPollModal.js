import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PropTypes from "prop-types";

const EditPollModal = ({
  theme,
  editPollVisible,
  setEditPollVisible,
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  editOptions,
  setEditOptions,
  newOptions,
  setNewOptions,
  editIsLoading,
  handleUpdatePollWithNewOption,
  addEditOption,
  newOption,
  setNewOption,
  handleCloseEditModal,
}) => {
  // Remove a specific new option
  const removeNewOption = (indexToRemove) => {
    if (typeof setNewOptions === "function") {
      setNewOptions((prev) => prev.filter((_, index) => index !== indexToRemove));
    } else {
      console.warn("setNewOptions is not a function:", setNewOptions);
    }
  };

  // Ensure editOptions and newOptions are arrays
  const safeEditOptions = Array.isArray(editOptions) ? editOptions : [];
  const safeNewOptions = Array.isArray(newOptions) ? newOptions : [];

  // Debug button disabled state
  useEffect(() => {
    console.log("Add Option Button Debug:", {
      totalOptions: safeEditOptions.length + safeNewOptions.length,
      newOption: newOption?.trim(),
      editIsLoading,
      setNewOptionsType: typeof setNewOptions,
      addEditOptionType: typeof addEditOption,
    });
  }, [safeEditOptions, safeNewOptions, newOption, editIsLoading, setNewOptions, addEditOption]);

  return (
    <Modal
      transparent={true}
      visible={editPollVisible}
      animationType="slide"
      onRequestClose={handleCloseEditModal}
    >
      <View className="flex-1 justify-end bg-black/50">
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={handleCloseEditModal}
        />
        <View className={`rounded-t-3xl p-5 ${theme === "dark" ? "bg-[#262626]" : "bg-white"}`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text
              className={`text-[20px] tracking-wide ${theme === "dark" ? "text-white" : "text-[#4CAF50]"}`}
              style={{ fontFamily: "OpenSans-Bold" }}
            >
              Edit Poll
            </Text>
            <TouchableOpacity onPress={handleCloseEditModal}>
              <Icon name="close" size={24} color={theme === "dark" ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>
          <Text
            className={`text-[13px] mb-1 tracking-wide ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
            style={{ fontFamily: "OpenSans-Medium" }}
          >
            Title
          </Text>
          <View
            className={`w-full border rounded-xl h-12 px-3 mb-4 flex-row items-center ${
              theme === "dark" ? "border-[#444] bg-[#333]" : "border-[#ccc] bg-[#f5f5f5]"
            }`}
          >
            <Text
              className={`flex-1 text-[14px] tracking-wide ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
              style={{ fontFamily: "OpenSans-Medium" }}
            >
              {editTitle || "No title"}
            </Text>
          </View>
          <Text
            className={`text-[13px] mb-1 tracking-wide ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
            style={{ fontFamily: "OpenSans-Medium" }}
          >
            Description
          </Text>
          <View
            className={`w-full px-3 mb-4 flex-row items-start ${
              theme === "dark" ? "border-[#444] bg-[#333]" : "border-[#ccc] bg-[#f5f5f5]"
            }`}
          >
            <Text
              className={`flex-1 text-[14px] tracking-wide pt-2 ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
              style={{ fontFamily: "OpenSans-Medium" }}
            >
              {editDescription || "No description"}
            </Text>
          </View>
          <Text
            className={`text-[13px] mb-2 tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
            style={{ fontFamily: "OpenSans-Bold" }}
          >
            Existing Options
          </Text>
          <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
            {safeEditOptions.length > 0 ? (
              safeEditOptions.map((option, index) => (
                <View
                  key={`existing-${index}`}
                  className={`flex-row items-center mb-2 w-full border rounded-xl h-12 px-3 ${
                    theme === "dark" ? "border-[#444] bg-[#333]" : "border-[#ccc] bg-[#f5f5f5]"
                  }`}
                >
                  <Text
                    className={`flex-1 text-[14px] tracking-wide ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
                    style={{ fontFamily: "OpenSans-Medium" }}
                  >
                    {option}
                  </Text>
                </View>
              ))
            ) : (
              <Text
                className={`text-[14px] tracking-wide ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
                style={{ fontFamily: "OpenSans-Medium" }}
              >
                No existing options
              </Text>
            )}
          </ScrollView>
          <Text
            className={`text-[13px] mb-2 tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
            style={{ fontFamily: "OpenSans-Bold" }}
          >
            New Options
          </Text>
          <View
            className={`flex-row items-center mb-2 w-full border rounded-xl h-12 px-3 ${
              theme === "dark" ? "border-[#444]" : "border-[#ccc]"
            }`}
          >
            <TextInput
              className={`flex-1 h-full text-[14px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
              value={newOption}
              onChangeText={setNewOption}
              placeholder="Enter new option..."
              placeholderTextColor={theme === "dark" ? "#ccc" : "#666"}
              style={{ fontFamily: "OpenSans-Medium" }}
              autoCapitalize="none"
              editable={!editIsLoading}
            />
            {newOption && newOption.trim() && (
              <TouchableOpacity
                onPress={() => setNewOption("")}
                className="ml-2"
                disabled={editIsLoading}
              >
                <Icon name="close-circle" size={20} color={theme === "dark" ? "#F44336" : "red"} />
              </TouchableOpacity>
            )}
          </View>
          {safeNewOptions.length > 0 && (
            <View className="mb-4">
              {safeNewOptions.map((option, index) => (
                <View
                  key={`new-${index}`}
                  className={`flex-row items-center mb-2 w-full border rounded-xl h-12 px-3 ${
                    theme === "dark" ? "border-[#444] bg-[#333]" : "border-[#ccc] bg-[#f5f5f5]"
                  }`}
                >
                  <Text
                    className={`flex-1 text-[14px] tracking-wide ${theme === "dark" ? "text-[#ccc]" : "text-[#666]"}`}
                    style={{ fontFamily: "OpenSans-Medium" }}
                  >
                    {option}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeNewOption(index)}
                    className="ml-2"
                    disabled={editIsLoading}
                  >
                    <Icon name="close-circle" size={20} color={theme === "dark" ? "F44336" : "red"} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity
            className={`flex-row items-center mb-4 ${
              (safeEditOptions.length + safeNewOptions.length >= 6 || !newOption?.trim() || editIsLoading)
                ? "opacity-50"
                : "opacity-100"
            }`}
            onPress={() => {
              if (newOption?.trim() && (safeEditOptions.length + safeNewOptions.length) < 6) {
                if (typeof addEditOption === "function") {
                  addEditOption();
                } else {
                  console.warn("addEditOption is not a function:", addEditOption);
                }
              } else {
                console.warn("Add Option error:", {
                  newOption: newOption?.trim(),
                  totalOptions: safeEditOptions.length + safeNewOptions.length,
                });
              }
            }}
            disabled={(safeEditOptions.length + safeNewOptions.length >= 6 || !newOption?.trim() || editIsLoading)}
          >
            <Icon name="plus" size={20} color={theme === "dark" ? "#60B8FF" : "#2196F3"} />
            <Text
              className={`text-[14px] tracking-wide ml-1 ${theme === "dark" ? "text-[#60B8FF]" : "text-[#2196F3]"}`}
              style={{ fontFamily: "OpenSans-Bold" }}
            >
              Add Option to List
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`bg-[#4CAF50] rounded-xl p-3 items-center ${
              (safeNewOptions.length === 0 && !newOption?.trim()) || editIsLoading ? "opacity-50" : "opacity-100"
            }`}
            onPress={handleUpdatePollWithNewOption}
            disabled={(safeNewOptions.length === 0 && !newOption?.trim()) || editIsLoading}
          >
            <Text
              className="text-white text-[14px] tracking-wide"
              style={{ fontFamily: "OpenSans" }}
            >
              {editIsLoading ? "Submitting..." : "Submit New Options"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

EditPollModal.propTypes = {
  theme: PropTypes.oneOf(["light", "dark"]).isRequired,
  editPollVisible: PropTypes.bool.isRequired,
  setEditPollVisible: PropTypes.func.isRequired,
  editTitle: PropTypes.string.isRequired,
  setEditTitle: PropTypes.func.isRequired,
  editDescription: PropTypes.string.isRequired,
  setEditDescription: PropTypes.func.isRequired,
  editOptions: PropTypes.arrayOf(PropTypes.string),
  setEditOptions: PropTypes.func.isRequired,
  newOptions: PropTypes.arrayOf(PropTypes.string),
  setNewOptions: PropTypes.func.isRequired,
  editIsLoading: PropTypes.bool.isRequired,
  handleUpdatePollWithNewOption: PropTypes.func.isRequired,
  addEditOption: PropTypes.func.isRequired,
  newOption: PropTypes.string.isRequired,
  setNewOption: PropTypes.func.isRequired,
  handleCloseEditModal: PropTypes.func.isRequired,
};

EditPollModal.defaultProps = {
  editOptions: [],
  newOptions: [],
};

export default EditPollModal;