import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import PropTypes from "prop-types";
import CreatePollModal from "./CreatePollModal";
import EditGroupModal from "./EditGroupModal";
import EditPollModal from "./EditPollModal";
import ConfirmCloseEditModal from "./ConfirmCloseEditModal";
import ConfirmDeleteGroupModal from "./ConfirmDeleteGroupModal";

const PollModals = ({
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
  editGroupVisible,
  setEditGroupVisible,
  editGroupName,
  setEditGroupName,
  editGroupLoading,
  handleUpdateGroup,
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
  editPollType,
  setEditPollType,
  editDuration,
  setEditDuration,
  editDurationUnit,
  setEditDurationUnit,
  editHasDuration,
  setEditHasDuration,
  editIsLoading,
  handleUpdatePollWithNewOption,
  addEditOption,
  newOption,
  setNewOption,
  handleCloseEditModal,
  confirmCloseVisible,
  setConfirmCloseVisible,
  confirmDeleteVisible,
  setConfirmDeleteVisible, // Fixed prop name
  handleDeleteGroup,
  resetEditForm,
  deleteGroupLoading,
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [visibilityPickerVisible, setVisibilityPickerVisible] = useState(false);
  const [editPickerVisible, setEditPickerVisible] = useState(false);
  const [editVisibilityPickerVisible, setEditVisibilityPickerVisible] = useState(false);

  // Add a new option (max 6 options)
  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  // Remove an option (min 2 options)
  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  // Check if edit modal has unsaved changes
  const hasEditProgress = () => {
    return (
      (editTitle?.trim() || "") !== "" ||
      (editDescription?.trim() || "") !== "" ||
      editOptions.some((opt) => (opt?.trim() || "") !== "") ||
      newOptions.some((opt) => (opt?.trim() || "") !== "") ||
      newOption.trim() !== "" ||
      editDuration !== ""
    );
  };

  // Render duration unit picker item
  const renderPickerItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setDurationUnit(item.value);
        setPickerVisible(false);
        console.log("Duration Unit:", item.value);
      }}
      className={`py-3 px-4 border-b ${theme === "dark" ? "border-[#444] bg-[#1A1A1A]" : "border-[#ccc] bg-[#F5F5F7]"}`}
    >
      <Text
        className={theme === "dark" ? "text-white" : "text-[#444]"}
        style={{ fontFamily: "OpenSans-Regular", fontSize: 13, letterSpacing: 0.5 }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Render edit duration unit picker item
  const renderEditPickerItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setEditDurationUnit(item.value);
        setEditPickerVisible(false);
        console.log("Edit Duration Unit:", item.value);
      }}
      className={`py-3 px-4 border-b ${theme === "dark" ? "border-[#444] bg-[#1A1A1A]" : "border-[#ccc] bg-[#F5F5F7]"}`}
    >
      <Text
        className={theme === "dark" ? "text-white" : "text-[#444]"}
        style={{ fontFamily: "OpenSans-Regular", fontSize: 13, letterSpacing: 0.5 }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Render visibility picker item
  const renderVisibilityItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setPollType(item.value);
        setVisibilityPickerVisible(false);
        console.log("Visibility:", item.value);
      }}
      className={`py-3 px-4 border-b ${theme === "dark" ? "border-[#444] bg-[#1A1A1A]" : "border-[#ccc] bg-[#F5F5F7]"}`}
    >
      <Text
        className={theme === "dark" ? "text-white" : "text-[#444]"}
        style={{ fontFamily: "OpenSans-Regular", fontSize: 13, letterSpacing: 0.5 }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  // Render edit visibility picker item
  const renderEditVisibilityItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setEditPollType(item.value);
        setEditVisibilityPickerVisible(false);
        console.log("Edit Visibility:", item.value);
      }}
      className={`py-3 px-4 border-b ${theme === "dark" ? "border-[#444] bg-[#1A1A1A]" : "border-[#ccc] bg-[#F5F5F7]"}`}
    >
      <Text
        className={theme === "dark" ? "text-white" : "text-[#444]"}
        style={{ fontFamily: "OpenSans-Regular", fontSize: 13, letterSpacing: 0.5 }}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <CreatePollModal
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
        addOption={addOption}
        removeOption={removeOption}
        setPickerVisible={setPickerVisible}
        setVisibilityPickerVisible={setVisibilityPickerVisible}
      />
      <EditGroupModal
        theme={theme}
        editGroupVisible={editGroupVisible}
        setEditGroupVisible={setEditGroupVisible}
        editGroupName={editGroupName}
        setEditGroupName={setEditGroupName}
        editGroupLoading={editGroupLoading}
        handleUpdateGroup={handleUpdateGroup}
      />
      <EditPollModal
        theme={theme}
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
        editIsLoading={editIsLoading}
        handleUpdatePollWithNewOption={handleUpdatePollWithNewOption}
        addEditOption={addEditOption}
        newOption={newOption}
        setNewOption={setNewOption}
        handleCloseEditModal={handleCloseEditModal}
      />
      <ConfirmCloseEditModal
        theme={theme}
        confirmCloseVisible={confirmCloseVisible}
        setConfirmCloseVisible={setConfirmCloseVisible}
        setEditPollVisible={setEditPollVisible}
        resetEditForm={resetEditForm}
        setNewOption={setNewOption}
      />
      <ConfirmDeleteGroupModal
        theme={theme}
        confirmDeleteVisible={confirmDeleteVisible}
        setConfirmDeleteVisible={setConfirmDeleteVisible}
        handleDeleteGroup={handleDeleteGroup}
        deleteGroupLoading={deleteGroupLoading}
      />
      {/* Duration Unit Picker Modal */}
      <Modal
        transparent={true}
        visible={pickerVisible}
        animationType="none"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View className={`w-full max-h-[200px] ${theme === "dark" ? "bg-[#262626]" : "bg-[#F5F5F7]"}`}>
            <FlatList
              data={[{ label: "Minutes", value: "minutes" }, { label: "Hours", value: "hours" }, { label: "Days", value: "days" }]}
              renderItem={renderPickerItem}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Visibility Picker Modal */}
      <Modal
        transparent={true}
        visible={visibilityPickerVisible}
        animationType="none"
        onRequestClose={() => setVisibilityPickerVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setVisibilityPickerVisible(false)}
        >
          <View className={`w-full max-h-[100px] ${theme === "dark" ? "bg-[#262626]" : "bg-[#F5F5F7]"}`}>
            <FlatList
              data={[{ label: "Public", value: "public" }, { label: "Private", value: "private" }]}
              renderItem={renderVisibilityItem}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Edit Duration Unit Picker Modal */}
      <Modal
        transparent={true}
        visible={editPickerVisible}
        animationType="none"
        onRequestClose={() => setEditPickerVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setEditPickerVisible(false)}
        >
          <View className={`w-full max-h-[200px] ${theme === "dark" ? "bg-[#262626]" : "bg-[#F5F5F7]"}`}>
            <FlatList
              data={[{ label: "Minutes", value: "minutes" }, { label: "Hours", value: "hours" }, { label: "Days", value: "days" }]}
              renderItem={renderEditPickerItem}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Edit Visibility Picker Modal */}
      <Modal
        transparent={true}
        visible={editVisibilityPickerVisible}
        animationType="none"
        onRequestClose={() => setEditVisibilityPickerVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setEditVisibilityPickerVisible(false)}
        >
          <View className={`w-full max-h-[100px] ${theme === "dark" ? "bg-[#262626]" : "bg-[#F5F5F7]"}`}>
            <FlatList
              data={[{ label: "Public", value: "public" }, { label: "Private", value: "private" }]}
              renderItem={renderEditVisibilityItem}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

PollModals.propTypes = {
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
  editGroupVisible: PropTypes.bool.isRequired,
  setEditGroupVisible: PropTypes.func.isRequired,
  editGroupName: PropTypes.string.isRequired,
  setEditGroupName: PropTypes.func.isRequired,
  editGroupLoading: PropTypes.bool.isRequired,
  handleUpdateGroup: PropTypes.func.isRequired,
  editPollVisible: PropTypes.bool.isRequired,
  setEditPollVisible: PropTypes.func.isRequired,
  editTitle: PropTypes.string.isRequired,
  setEditTitle: PropTypes.func.isRequired,
  editDescription: PropTypes.string.isRequired,
  setEditDescription: PropTypes.func.isRequired,
  editOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  setEditOptions: PropTypes.func.isRequired,
  newOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  setNewOptions: PropTypes.func.isRequired,
  editPollType: PropTypes.oneOf(["public", "private"]).isRequired,
  setEditPollType: PropTypes.func.isRequired,
  editDuration: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  setEditDuration: PropTypes.func.isRequired,
  editDurationUnit: PropTypes.oneOf(["minutes", "hours", "days"]).isRequired,
  setEditDurationUnit: PropTypes.func.isRequired,
  editHasDuration: PropTypes.bool.isRequired,
  setEditHasDuration: PropTypes.func.isRequired,
  editIsLoading: PropTypes.bool.isRequired,
  handleUpdatePollWithNewOption: PropTypes.func.isRequired,
  addEditOption: PropTypes.func.isRequired,
  newOption: PropTypes.string.isRequired,
  setNewOption: PropTypes.func.isRequired,
  handleCloseEditModal: PropTypes.func.isRequired,
  confirmCloseVisible: PropTypes.bool.isRequired,
  setConfirmCloseVisible: PropTypes.func.isRequired,
  confirmDeleteVisible: PropTypes.bool.isRequired,
  setConfirmDeleteVisible: PropTypes.func.isRequired,
  handleDeleteGroup: PropTypes.func.isRequired,
  resetEditForm: PropTypes.func.isRequired,
  deleteGroupLoading: PropTypes.bool.isRequired,
};

export default PollModals;