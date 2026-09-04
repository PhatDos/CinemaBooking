import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '@/src/api/client';
import { checkInTicket } from '@/src/api/tickets';
import { useAuth } from '@/src/auth/AuthContext';
import type { CheckInTicketResponse } from '@/src/types';

export default function ScanTicketScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInTicketResponse | null>(null);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('info');

  const canCheckIn = user?.roles.some((role) => role === 'Staff' || role === 'Admin') ?? false;

  if (isLoading) {
    return <CenteredLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!canCheckIn) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Scanner unavailable</Text>
        <Text style={styles.bodyText}>Your account cannot check in tickets.</Text>
        <Pressable onPress={() => router.replace('/movies')} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to movies</Text>
        </Pressable>
      </View>
    );
  }

  if (!permission) {
    return <CenteredLoader />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access</Text>
        <Text style={styles.bodyText}>Allow camera permission to scan ticket QR codes.</Text>
        <Pressable onPress={requestPermission} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  async function handleBarcodeScanned(scanningResult: BarcodeScanningResult) {
    if (isScanned || isSubmitting) {
      return;
    }

    setIsScanned(true);
    setIsSubmitting(true);
    setResult(null);
    setMessage('');
    setMessageTone('info');

    try {
      const checkInResult = await checkInTicket(scanningResult.data);
      setResult(checkInResult);
      setMessage('Check-in successful');
      setMessageTone('success');
    } catch (error) {
      setResult(null);
      setMessage(getCheckInErrorMessage(error));
      setMessageTone('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  function scanAgain() {
    setIsScanned(false);
    setResult(null);
    setMessage('');
    setMessageTone('info');
  }

  return (
    <View style={styles.container}>
      <CameraView
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        facing="back"
        onBarcodeScanned={isScanned ? undefined : handleBarcodeScanned}
        style={styles.camera}
      />

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Scan Ticket</Text>
      </View>

      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTopLeft]} />
          <View style={[styles.corner, styles.cornerTopRight]} />
          <View style={[styles.corner, styles.cornerBottomLeft]} />
          <View style={[styles.corner, styles.cornerBottomRight]} />
        </View>
        <Text style={styles.hint}>Place the ticket QR inside the frame</Text>
      </View>

      {(isSubmitting || message) && (
        <View style={styles.resultPanel}>
          {isSubmitting ? (
            <>
              <ActivityIndicator size="large" />
              <Text style={styles.resultTitle}>Checking ticket...</Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.resultTitle,
                  messageTone === 'success' ? styles.successText : styles.errorText,
                ]}>
                {message}
              </Text>

              {result && (
                <View style={styles.resultDetails}>
                  <Text style={styles.detailText}>Status: {result.status}</Text>
                  <Text style={styles.detailText}>Ticket: {shortenId(result.ticketId)}</Text>
                  <Text style={styles.detailText}>Checked in: {formatDateTime(result.usedAt)}</Text>
                </View>
              )}

              <Pressable onPress={scanAgain} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Scan another ticket</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

function CenteredLoader() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function getCheckInErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return error.message || 'Ticket cannot be checked in.';
      case 403:
        return 'You are not allowed to check in this ticket.';
      case 404:
        return 'Ticket not found.';
      case 409:
        return 'Ticket has already been used.';
      default:
        return error.message || 'Check-in failed.';
    }
  }

  return 'Check-in failed.';
}

function shortenId(value: string) {
  return value.length <= 12 ? value : `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  camera: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  topBar: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
    paddingHorizontal: 14,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  screenTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 8,
  },
  corner: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderColor: '#ffffff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 8,
  },
  hint: {
    marginTop: 20,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultPanel: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 36,
    zIndex: 3,
    alignItems: 'stretch',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 18,
  },
  resultTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  resultDetails: {
    marginTop: 14,
    gap: 6,
  },
  detailText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  bodyText: {
    marginTop: 10,
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#111827',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  successText: {
    color: '#047857',
  },
  errorText: {
    color: '#b91c1c',
  },
});
