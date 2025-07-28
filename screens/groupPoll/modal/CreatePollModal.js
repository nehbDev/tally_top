import React from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, TouchableWithoutFeedback } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PropTypes from "prop-types";

const CreatePollModal = ({
  theme,
  createPollVisible,
  setCreatePollVisible,
  title,
  setTitle,
  description,
  setDescription,
  options,
  setOptions,
  pollType,
  setPollType,
  duration,
  setDuration,
  durationUnit,
  setDurationUnit,
  hasDuration,
  setHasDuration,
  isLoading,
  handleCreatePoll,
  addOption,
  removeOption,
  setPickerVisible,
  setVisibilityPickerVisible,
}) => {
  return (
    <Modal
      transparent={true}
      visible={createPollVisible}
      animationType="slide"
      onRequestClose={() => {
        console.log("Create Poll Modal close requested");
        setCreatePollVisible(false);
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          console.log("Create Poll Modal background clicked");
          setCreatePollVisible(false);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-3xl p-5 ${theme === "dark" ? "bg-[#262626]" : "bg-white"}`}>
            <Text
              className={`text-[18px] tracking-wide mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}
              style={{ fontFamily: "OpenSans-SemiBold" }}
            >
              Create New Poll
            </Text>
            <TextInput
              className={`border-b rounded-lg h-12 mb-4 text-[13px] tracking-wide ${theme === "dark" ? "border-[#444] text-white" : "border-[#ccc] text-black"}`}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter poll title..."
              placeholderTextColor={theme === "dark" ? "#ccc" : "#666"}
              style={{ fontFamily: "OpenSans-Medium" }}
            />
            <TextInput
              className={`border-b rounded-lg h-16 mb-4 text-[13px] tracking-wide ${theme === "dark" ? "border-[#444] text-white" : "border-[#ccc] text-black"}`}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description (optional)..."
              placeholderTextColor={theme === "dark" ? "#ccc" : "#666"}
              style={{ fontFamily: "OpenSans-Medium" }}
              multiline
            />
            <Text
              className={`text-[13px] mb-2 tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
              style={{ fontFamily: "OpenSans-Bold" }}
            >
              Options
            </Text>
            <ScrollView style={{ maxHeight: 150 }}>
              {options.map((option, index) => (
                <View
                  key={index}
                  className={`flex-row items-center mb-2 w-full border rounded-xl h-12 px-2.5 ${theme === "dark" ? "border-[#444]" : "border-[#ccc]"}`}
                >
                  <TextInput
                    className={`flex-1 h-full text-[12px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
                    value={option}
                    onChangeText={(text) => {
                      const newOptions = [...options];
                      newOptions[index] = text;
                      setOptions(newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={theme === "dark" ? "#ccc" : "#666"}
                    style={{ fontFamily: "OpenSans-Medium" }}
                  />
                  {index >= 2 && (
                    <TouchableOpacity onPress={() => removeOption(index)} className="ml-2">
                      <Icon name="close-circle" size={20} color={theme === "dark" ? "#FF5555" : "red"} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="flex-row items-center mb-4 mt-2"
              onPress={addOption}
              disabled={options.length >= 6}
            >
              <Icon name="plus" size={19} color={theme === "dark" ? "#60B8FF" : "#50A8EE"} />
              <Text
                className={`text-[12px] tracking-wide ${theme === "dark" ? "text-[#60B8FF]" : "text-[#50A8EE]"}`}
                style={{ fontFamily: "OpenSans-Medium" }}
              >
                Add Option
              </Text>
            </TouchableOpacity>
            <Text
              className={`text-[13px] mb-2 tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
              style={{ fontFamily: "OpenSans-Bold" }}
            >
              Duration (Optional)
            </Text>
            <View className="flex-row items-center mb-4">
              <TouchableOpacity
                className={`mr-2 p-2 ${!hasDuration ? "bg-[#4CAF50]" : "bg-gray-300"} rounded`}
                onPress={() => setHasDuration(false)}
              >
                <Text
                  className={`text-[12px] ${!hasDuration ? "text-white" : "text-black"}`}
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  No Expiration
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`p-2 ${hasDuration ? "bg-[#4CAF50]" : "bg-gray-300"} rounded`}
                onPress={() => setHasDuration(true)}
              >
                <Text
                  className={`text-[12px] ${hasDuration ? "text-white" : "text-black"}`}
                  style={{ fontFamily: "OpenSans-Medium" }}
                >
                  Set Duration
                </Text>
              </TouchableOpacity>
            </View>
            {hasDuration && (
              <View
                className={`flex-row items-center mb-4 w-full border-b rounded-md h-12 px-2.5 ${theme === "dark" ? "border-[#444]" : "border-[#ccc]"}`}
              >
                <TextInput
                  className={`flex-1 h-full text-[12px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
                  value={duration}
                  onChangeText={(text) => {
                    const newDuration = text === "" ? "" : parseInt(text, 10);
                    if (newDuration >= 0 || text === "") {
                      setDuration(newDuration);
                      console.log("Duration Input:", newDuration);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="Enter duration..."
                  placeholderTextColor={theme === "dark" ? "#ccc" : "#666"}
                  style={{ fontFamily: "OpenSans-Medium" }}
                />
                <TouchableOpacity
                  onPress={() => setPickerVisible(true)}
                  className={`flex-row items-center justify-between gap-5 h-full px-2 ${theme === "dark" ? "bg-[#1A1A1A]" : "bg-[#FFFFFF]"}`}
                >
                  <Text
                    className={`text-[12px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
                    style={{ fontFamily: "OpenSans-Medium" }}
                  >
                    {durationUnit === "minutes" ? "Minutes" : durationUnit === "hours" ? "Hours" : "Days"}
                  </Text>
                  <Icon name="chevron-down" size={20} color={theme === "dark" ? "#fff" : "#444"} />
                </TouchableOpacity>
              </View>
            )}
            <Text
              className={`text-[13px] mb-2 tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
              style={{ fontFamily: "OpenSans-Bold" }}
            >
              Visibility
            </Text>
            <TouchableOpacity
              onPress={() => setVisibilityPickerVisible(true)}
              className={`w-full border-b rounded-md h-12 px-2.5 mb-4 flex-row items-center justify-between ${theme === "dark" ? "border-[#444] bg-[#1A1A1A]" : "border-[#ccc] bg-[#FFFFFF]"}`}
            >
              <Text
                className={`text-[12px] tracking-wide ${theme === "dark" ? "text-white" : "text-black"}`}
                style={{ fontFamily: "OpenSans-Medium" }}
              >
                {pollType === "public" ? "Public" : "Private"}
              </Text>
              <Icon name="chevron-down" size={20} color={theme === "dark" ? "#fff" : "#444"} />
            </TouchableOpacity>
            <View className="flex-row justify-between mb-2">
              <TouchableOpacity
                className={`bg-[#4CAF50] rounded-lg p-3 flex-1 mr-2 ${isLoading ? "opacity-50" : "opacity-100"}`}
                onPress={() => {
                  console.log("Create Poll button pressed");
                  handleCreatePoll();
                }}
                disabled={isLoading || options.filter((opt) => opt.trim() !== "").length < 2 || (hasDuration && !duration && duration !== 0)}
              >
                <Text
                  className="text-white text-[14px] tracking-wide text-center"
                  style={{ fontFamily: "OpenSans-Regular" }}
                >
                  {isLoading ? "Creating..." : "Create Poll"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="border border-[#F44336] rounded-lg p-3 flex-1"
                onPress={() => {
                  console.log("Cancel Create Poll button pressed");
                  setCreatePollVisible(false);
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

CreatePollModal.propTypes = {
  theme: PropTypes.oneOf(["light", "dark"]).isRequired,
  createPollVisible: PropTypes.bool.isRequired,
  setCreatePollVisible: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  setTitle: PropTypes.func.isRequired,
  description: PropTypes.string.isRequired,
  setDescription: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  setOptions: PropTypes.func.isRequired,
  pollType: PropTypes.oneOf(["public", "private"]).isRequired,
  setPollType: PropTypes.func.isRequired,
  duration: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  setDuration: PropTypes.func.isRequired,
  durationUnit: PropTypes.oneOf(["minutes", "hours", "days"]).isRequired,
  setDurationUnit: PropTypes.func.isRequired,
  hasDuration: PropTypes.bool.isRequired,
  setHasDuration: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  handleCreatePoll: PropTypes.func.isRequired,
  addOption: PropTypes.func.isRequired,
  removeOption: PropTypes.func.isRequired,
  setPickerVisible: PropTypes.func.isRequired,
  setVisibilityPickerVisible: PropTypes.func.isRequired,
};

export default CreatePollModal;