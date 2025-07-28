import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const QRCodeScannerModal = ({ onScan, onClose, theme }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    // Reset scanned state when modal is opened
    setScanned(false);
  }, []);

  if (!permission) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={[styles.fallbackText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          Loading camera permissions...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fallbackContainer, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fff' }]}>
        <Text style={[styles.message, { color: theme === 'dark' ? '#fff' : '#000' }]}>
          We need your permission to scan QR codes
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme === 'dark' ? '#333' : '#ccc' }]} onPress={onClose}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) {
      console.log('Scan attempt: Already scanned, ignoring');
      return;
    }
    setScanned(true);

    console.log('Scanned QR Code - Type:', type, 'Data:', data);
    const pollIdMatch = data.match(/pollnow:\/\/poll\/(\d+)/);
    const pollId = pollIdMatch ? parseInt(pollIdMatch[1], 10) : null;

    if (pollId && !isNaN(pollId)) {
      console.log('Valid poll ID extracted:', pollId);
      try {
        await onScan(pollId);
      } catch (error) {
        console.error('Error during scan processing:', error);
        Alert.alert('Error', `Failed to process QR code: ${error.message}`);
      }
      setTimeout(() => setScanned(false), 1000); // Allow rescan after 1 second
    } else {
      console.log('Invalid QR Code data:', data);
      Alert.alert('Error', 'Invalid QR code: not a valid poll ID');
      setTimeout(() => setScanned(false), 1000); // Allow rescan after 1 second
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={[styles.overlay, { backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>
          <Text
            style={[styles.headerText, { color: theme === 'dark' ? '#fff' : '#fff' }]}
          >
            Scan a PollNow QR Code
          </Text>
          <View style={styles.scanFrame}>
            <View style={[styles.frameCorner, styles.topLeft]} />
            <View style={[styles.frameCorner, styles.topRight]} />
            <View style={[styles.frameCorner, styles.bottomLeft]} />
            <View style={[styles.frameCorner, styles.bottomRight]} />
          </View>
          <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme === 'dark' ? '#333' : '#ccc' }]} onPress={onClose}>
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 1,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 10,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#50A8EE',
    borderRadius: 12,
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#50A8EE',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#50A8EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QRCodeScannerModal;