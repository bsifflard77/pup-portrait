/**
 * Upload tab — the "Send Your Pup on an Adventure" hero feature, added in
 * the 2026-05-19 relaunch sprint.
 *
 * Flow:
 *   1. User taps a big "Pick a photo of your dog" CTA.
 *   2. expo-image-picker opens with square crop enabled.
 *   3. If the user is on a paying tier, we upload the cropped photo to the
 *      `pet-uploads` Supabase Storage bucket (24-hour TTL) and call the
 *      `generate-pack` Edge Function.
 *   4. Edge Function returns 12 identity-preserved portraits (Nano Banana 2).
 *   5. We push to /pack-result with the portrait IDs.
 *
 * Free users see a paywall card instead of step 3.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { supabase } from '../../lib/supabase';
import { PACK_THEMES, canUploadPhoto } from '@pup-portrait/shared';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const maxWidth = isWeb ? 480 : screenWidth;

type UploadStage = 'idle' | 'cropped' | 'uploading' | 'generating' | 'done' | 'error';

export default function UploadScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { colors } = useThemeStore();

  const [stage, setStage] = useState<UploadStage>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [packCreditsRemaining, setPackCreditsRemaining] = useState<number | null>(null);

  const tier = user?.subscriptionTier ?? 'free';
  const canUpload = canUploadPhoto(tier);
  const hasEnoughCredits =
    tier === 'pack' ? (user?.packCredits ?? 0) >= 12 : true;

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
      setStage('cropped');
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Could not open photo picker', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const startPackGeneration = async () => {
    if (!user || !accessToken || !imageBase64) {
      Alert.alert('Hmm', 'You need to sign in and pick a photo first.');
      return;
    }
    if (!canUpload) {
      router.push('/upgrade');
      return;
    }

    try {
      setStage('uploading');
      setStatusMessage('Uploading your photo securely…');

      // Convert base64 → Uint8Array for the storage upload.
      const binary = atob(imageBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const storagePath = `${user.id}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from('pet-uploads')
        .upload(storagePath, bytes, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

      setStage('generating');
      setStatusMessage(`Generating 12 portraits of ${user.displayName || 'your pup'}…`);

      // Hit the generate-pack Edge Function. Typical latency: ~60–90s.
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-pack`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ referenceImagePath: storagePath }),
      });

      const payload = await res.json();

      if (!res.ok) {
        // 402 → paywall flow
        if (res.status === 402) {
          router.push('/upgrade');
          return;
        }
        throw new Error(payload.message || payload.error || `Pack generation failed (HTTP ${res.status})`);
      }

      setPackCreditsRemaining(payload.remainingPackCredits);
      setStage('done');
      setStatusMessage(
        `Pack ready — ${payload.portraits.length} portraits${
          payload.errors?.length ? ` (${payload.errors.length} theme${payload.errors.length === 1 ? '' : 's'} failed)` : ''
        }`
      );

      // Stash the portrait IDs and push the user to the gallery filtered to
      // photo-upload results. (A dedicated pack-result screen is the natural
      // next-iteration improvement.)
      router.push('/(tabs)/gallery');
    } catch (err) {
      console.error('Pack generation failed:', err);
      setStage('error');
      setStatusMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const reset = () => {
    setStage('idle');
    setImageUri(null);
    setImageBase64(null);
    setStatusMessage('');
  };

  const styles = makeStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.inner}>
        <Text style={styles.title}>Your dog, reimagined.</Text>
        <Text style={styles.subtitle}>
          Upload one photo. Get 12 themed portraits that look exactly like your dog —
          same markings, same color, same goofy face.
        </Text>

        {/* Image picker / preview area */}
        <View style={styles.previewCard}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} contentFit="cover" />
          ) : (
            <Pressable style={styles.placeholder} onPress={pickImage}>
              <Ionicons name="cloud-upload-outline" size={56} color={colors.primary} />
              <Text style={styles.placeholderText}>Tap to pick a photo of your dog</Text>
              <Text style={styles.placeholderHint}>Square crop · JPG or PNG · 10MB max</Text>
            </Pressable>
          )}
        </View>

        {imageUri && stage === 'cropped' && (
          <Pressable style={styles.secondaryButton} onPress={pickImage}>
            <Text style={styles.secondaryButtonText}>Pick a different photo</Text>
          </Pressable>
        )}

        {/* CTA */}
        {!canUpload && imageUri && (
          <View style={styles.paywall}>
            <Text style={styles.paywallTitle}>Unlock photo upload</Text>
            <Text style={styles.paywallBody}>
              The 12-portrait pack is included with any paid tier. Pack: $9.99 one-time, Premium: $5.99/mo.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/upgrade')}>
              <Text style={styles.primaryButtonText}>See plans</Text>
            </Pressable>
          </View>
        )}

        {canUpload && !hasEnoughCredits && (
          <View style={styles.paywall}>
            <Text style={styles.paywallTitle}>Pack credits low</Text>
            <Text style={styles.paywallBody}>
              You have {user?.packCredits ?? 0} portraits left — you need 12 for a full pack. Add another pack to continue.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/upgrade')}>
              <Text style={styles.primaryButtonText}>Buy another pack</Text>
            </Pressable>
          </View>
        )}

        {canUpload && hasEnoughCredits && imageUri && stage === 'cropped' && (
          <Pressable style={styles.primaryButton} onPress={startPackGeneration}>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Send my pup on an adventure</Text>
          </Pressable>
        )}

        {(stage === 'uploading' || stage === 'generating') && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{statusMessage}</Text>
            <Text style={styles.loadingHint}>
              {stage === 'generating' ? 'This takes about 60–90 seconds.' : 'Almost there…'}
            </Text>
          </View>
        )}

        {stage === 'done' && (
          <View style={styles.success}>
            <Ionicons name="checkmark-circle" size={48} color={'#1a7c54'} />
            <Text style={styles.successText}>{statusMessage}</Text>
            <Pressable style={styles.secondaryButton} onPress={reset}>
              <Text style={styles.secondaryButtonText}>Make another pack</Text>
            </Pressable>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.error}>
            <Ionicons name="warning-outline" size={32} color={'#c2453a'} />
            <Text style={styles.errorText}>{statusMessage}</Text>
            <Pressable style={styles.secondaryButton} onPress={reset}>
              <Text style={styles.secondaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {/* The 12 themes preview */}
        <Text style={styles.sectionTitle}>What you'll get</Text>
        <Text style={styles.sectionSubtitle}>12 themed portraits, every one unmistakably your dog.</Text>
        <View style={styles.themeGrid}>
          {PACK_THEMES.map((theme) => (
            <View key={theme.id} style={styles.themeChip}>
              <Ionicons name={theme.icon as any} size={18} color={colors.primary} />
              <Text style={styles.themeLabel}>{theme.label}</Text>
            </View>
          ))}
        </View>

        {/* Privacy reassurance — important for upload feature trust */}
        <View style={styles.privacyCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.muted} />
          <Text style={styles.privacyText}>
            Your photo is auto-deleted from our servers within 24 hours.
            We never use your photo to train AI models or share it with anyone.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: 20, alignItems: 'center' },
    inner: { width: '100%', maxWidth, gap: 16 },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.muted,
      marginBottom: 8,
    },
    previewCard: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    preview: { width: '100%', height: '100%' },
    placeholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 24,
    },
    placeholderText: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    placeholderHint: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
    },
    primaryButton: {
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    paywall: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 14,
      padding: 18,
      gap: 10,
    },
    paywallTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    paywallBody: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.muted,
    },
    loading: { alignItems: 'center', gap: 10, padding: 18 },
    loadingText: { fontSize: 15, color: colors.text, fontWeight: '500', textAlign: 'center' },
    loadingHint: { fontSize: 12, color: colors.muted, textAlign: 'center' },
    success: { alignItems: 'center', gap: 12, padding: 18 },
    successText: { fontSize: 15, color: colors.text, fontWeight: '500', textAlign: 'center' },
    error: { alignItems: 'center', gap: 10, padding: 18 },
    errorText: { fontSize: 14, color: '#c2453a', textAlign: 'center' },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 12,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 8,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    themeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    themeLabel: {
      fontSize: 13,
      color: colors.text,
    },
    privacyCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
    },
    privacyText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: colors.muted,
    },
  });
}
