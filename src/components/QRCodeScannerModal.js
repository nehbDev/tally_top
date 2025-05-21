import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const QRCodeScannerModal = ({ onScan, onClose, theme }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Scanner only available on Android</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.message}>We need your permission to scan QR codes</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
    const pollId = pollIdMatch ? parseInt(pollIdMatch[1], 10) : parseInt(data, 10);

    if (!isNaN(pollId)) {
      console.log('Valid poll ID extracted:', pollId);
      await onScan(pollId); // Call onScan and wait for it to complete
      setScanned(false); // Reset immediately after successful scan
    } else {
      console.log('Invalid QR Code data:', data);
      Alert.alert('Error', 'Invalid QR code: not a valid poll ID');
      setTimeout(() => {
        console.log('Resetting scanned state for retry');
        setScanned(false);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeTypes={['qr']}
        onBarcodeScanned={handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <Text
            style={ styles.headerText}
          >
            Scan a PollNow QR Code
          </Text>
          <View style={styles.scanFrame}>
            <View style={[styles.frameCorner, styles.topLeft]} />
            <View style={[styles.frameCorner, styles.topRight]} />
            <View style={[styles.frameCorner, styles.bottomLeft]} />
            <View style={[styles.frameCorner, styles.bottomRight]} />
          </View>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 1,
    textAlign: 'center',
    color: 'white',
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
    backgroundColor: '#1a1a1a',
  },
  fallbackText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  message: {
    color: '#fff',
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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