import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { GuestData } from '@pup-portrait/shared';

const GUEST_KEY = 'pup_portrait_guest';

// Generate a simple device fingerprint
function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

async function getStorage(): Promise<Storage | typeof SecureStore> {
  if (Platform.OS === 'web') {
    return localStorage;
  }
  return SecureStore;
}

export async function getGuestData(): Promise<GuestData | null> {
  try {
    if (Platform.OS === 'web') {
      const data = localStorage.getItem(GUEST_KEY);
      return data ? JSON.parse(data) : null;
    } else {
      const data = await SecureStore.getItemAsync(GUEST_KEY);
      return data ? JSON.parse(data) : null;
    }
  } catch {
    return null;
  }
}

export async function hasGuestUsedFreeTrial(): Promise<boolean> {
  const data = await getGuestData();
  return data?.hasUsedFreeGeneration ?? false;
}

export async function markGuestTrialUsed(): Promise<void> {
  const existingData = await getGuestData();

  const data: GuestData = {
    hasUsedFreeGeneration: true,
    generatedAt: new Date().toISOString(),
    deviceId: existingData?.deviceId ?? generateDeviceId(),
  };

  const jsonData = JSON.stringify(data);

  if (Platform.OS === 'web') {
    localStorage.setItem(GUEST_KEY, jsonData);
  } else {
    await SecureStore.setItemAsync(GUEST_KEY, jsonData);
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  const data = await getGuestData();
  if (data?.deviceId) {
    return data.deviceId;
  }

  // Create new fingerprint
  const deviceId = generateDeviceId();
  const newData: GuestData = {
    hasUsedFreeGeneration: false,
    generatedAt: null,
    deviceId,
  };

  const jsonData = JSON.stringify(newData);

  if (Platform.OS === 'web') {
    localStorage.setItem(GUEST_KEY, jsonData);
  } else {
    await SecureStore.setItemAsync(GUEST_KEY, jsonData);
  }

  return deviceId;
}

export async function clearGuestData(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(GUEST_KEY);
  } else {
    await SecureStore.deleteItemAsync(GUEST_KEY);
  }
}
