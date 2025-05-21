import React from 'react';
import { View, Text, Modal, Pressable, TouchableWithoutFeedback, TouchableHighlight } from 'react-native';

const LogoutModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  theme 
}) => {
  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Background touch area */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View 
          className={`flex-1 justify-end items-center ${
            theme === 'dark' ? 'bg-black/50' : 'bg-black/50'
          }`}
        >
          <TouchableWithoutFeedback>
            <View
              className={`p-5 rounded-t-3xl w-full ${
                theme === 'dark' ? 'bg-[#262626]' : 'bg-white'
              }`}
            >
              <Text
                className={`text-[15px] mb-10 tracking-wide ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}
                style={{ fontFamily: "OpenSans-SemiBold" }}
              >
                Are you sure you want to log out?
              </Text>
              <View className="flex-row gap-2 justify-between">
                <TouchableHighlight
                  className={`p-2 border  rounded-lg flex-1 items-center ${
                    theme === 'dark' ? 'border-white' : 'border-[#444]'
                  }`}
                  underlayColor={theme === 'dark' ? '#333333' : '#e5e5e5'}
                  onPress={onClose}
                >
                  <Text
                    className={`text-[13px] tracking-wide text-center ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}
                    style={{ fontFamily: "OpenSans-Regular" }}

                  >
                    Cancel
                  </Text>
                </TouchableHighlight>
                <TouchableHighlight
                  className="p-2 rounded-lg flex-1 items-center bg-[#FF3B30]"
                  underlayColor={theme === 'dark' ? '#FF3B30' : '#FF3B30'}
                  onPress={onConfirm}
                >
                  <Text className="text-white text-[13px] tracking-wide text-center"
                  style={{ fontFamily: "OpenSans-Regular" }}
                  >Confirm</Text>
                </TouchableHighlight>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default LogoutModal;