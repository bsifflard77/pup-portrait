/**
 * Upload tab — "Send Your Pup on an Adventure".
 *
 * Two flows, branched on tier:
 *   • PAID (pack/premium/realism/lifetime): upload one photo → generate-pack →
 *     12 identity-preserved themed portraits (no watermark).
 *   • FREE (2026-05-26 one-time offer): upload one photo → 1 watermarked
 *     portrait + up to 5 watermarked background variations (6 images total),
 *     then paywall. Photo upload is the free conversion hook; the watermark is
 *     removed by any paid purchase. See
 *     30_Specs/2026-05-25_Spec_Free-Tier-Offer_Monomoy.md
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
import { PACK_THEMES, PREMIUM_BACKGROUNDS, isPaidTier, PRICING } from '@pup-portrait/shared';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const maxWidth = isWeb ? 480 : screenWidth;

const FREE_TOTAL = PRICING.FREE.freeTotalImages; // 6 (1 portrait + 5 backgrounds)

type UploadStage = 'idle' | 'cropped' | 'uploading' | 'generating' | 'done' | 'error';

interface FreeImage {
  url: string;
  label: string;
}

export default function UploadScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { colors } = useThemeStore();

  const [stage, setStage] = useState<UploadStage>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [packCreditsRemaining, setPackCreditsRemaining] = useState<number | null>(null);

  // Free-flow state
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [freeImages, setFreeImages] = useState<FreeImage[]>([]);
  const [usedBackgrounds, setUsedBackgrounds] = useState<string[]>([]);

  const tier = user?.subscriptionTier ?? 'free';
  const paid = isPaidTier(tier) || tier === 'pack';
  const freeOfferUsed = user?.freeOfferUsed ?? false;
  const freeImagesUsed = user?.freeImagesUsed ?? 0;
  const hasEnoughCredits = tier === 'pack' ? (user?.packCredits ?? 0) >= 12 : true;

  // Across reloads the source of truth is the DB counter; within a session we
  // also count what we just made.
  const freeUsedCount = Math.max(freeImagesUsed, freeImages.length);
  const freeRemaining = Math.max(0, FREE_TOTAL - freeUsedCount);
  const freeExhausted = freeOfferUsed || freeRemaining <= 0;

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

  // Upload the chosen photo to pet-uploads once; reused for every free image.
  const uploadPhotoOnce = async (): Promise<string> => {
    if (storagePath) return storagePath;
    if (!user || !imageBase64) throw new Error('Pick a photo first.');
    const binary = atob(imageBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const path = `${user.id}/${fileName}`;
    const { error: upErr } = await supabase.storage
      .from('pet-uploads')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
    setStoragePath(path);
    return path;
  };

  // ---------- PAID: 12-portrait pack ----------
  const startPackGeneration = async () => {
    if (!user || !accessToken || !imageBase64) {
      Alert.alert('Hmm', 'You need to sign in and pick a photo first.');
      return;
    }
    try {
      setStage('uploading');
      setStatusMessage('Uploading your photo securely…');
      const path = await uploadPhotoOnce();

      setStage('generating');
      setStatusMessage(`Generating 12 portraits of ${user.displayName || 'your pup'}…`);

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-pack`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceImagePath: path }),
      });
      const payload = await res.json();
      if (!res.ok) {
        if (res.status === 402) { router.push('/upgrade'); return; }
        throw new Error(payload.message || payload.error || `Pack generation failed (HTTP ${res.status})`);
      }
      setPackCreditsRemaining(payload.remainingPackCredits);
      setStage('done');
      setStatusMessage(`Pack ready — ${payload.portraits.length} portraits`);
      router.push('/(tabs)/gallery');
    } catch (err) {
      console.error('Pack generation failed:', err);
      setStage('error');
      setStatusMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // ---------- FREE: 1 portrait + up to 5 backgrounds ----------
  const generateFreeImage = async (bg?: (typeof PREMIUM_BACKGROUNDS)[number]) => {
    if (!user || !accessToken || !imageBase64) {
      Alert.alert('Hmm', 'You need to sign in and pick a photo first.');
      return;
    }
    if (freeExhausted) { router.push('/upgrade'); return; }
    try {
      setStage('generating');
      setStatusMessage(bg ? `Adding the ${bg.name} scene…` : 'Creating your free portrait…');
      const path = await uploadPhotoOnce();

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-portrait`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ breed: 'random', referenceImagePath: path, background: bg?.value }),
      });
      const payload = await res.json();
      if (!res.ok) {
        // Free offer used up → paywall.
        if (res.status === 429 || res.status === 402) {
          await useAuthStore.getState().refreshUser();
          router.push('/upgrade');
          return;
        }
        throw new Error(payload.message || payload.error || `Generation failed (HTTP ${res.status})`);
      }
      const url = payload.portrait?.image_url ?? payload.portrait?.imageUrl;
      setFreeImages((prev) => [...prev, { url, label: bg?.name ?? 'Your portrait' }]);
      if (bg) setUsedBackgrounds((prev) => [...prev, bg.id]);
      setStage('done');
      setStatusMessage('');
      // Sync the DB counter (drives freeOfferUsed once 6 are reached).
      await useAuthStore.getState().refreshUser();
    } catch (err) {
      console.error('Free generation failed:', err);
      setStage('error');
      setStatusMessage(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const reset = () => {
    setStage('idle');
    setImageUri(null);
    setImageBase64(null);
    setStatusMessage('');
    setStoragePath(null);
    setFreeImages([]);
    setUsedBackgrounds([]);
  };

  const styles = makeStyles(colors);
  const busy = stage === 'uploading' || stage === 'generating';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.inner}>
        <Text style={styles.title}>Your dog, reimagined.</Text>
        <Text style={styles.subtitle}>
          {paid
            ? 'Upload one photo. Get 12 themed portraits that look exactly like your dog — same markings, same color, same goofy face.'
            : 'Upload one photo and get a free portrait of your own dog, plus five scenes. Free portraits include a small watermark — upgrade to remove it.'}
        </Text>

        {/* Image picker / preview */}
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

        {imageUri && stage === 'cropped' && !busy && (
          <Pressable style={styles.secondaryButton} onPress={pickImage}>
            <Text style={styles.secondaryButtonText}>Pick a different photo</Text>
          </Pressable>
        )}

        {/* ---------- PAID 12-pack CTA ---------- */}
        {paid && !hasEnoughCredits && (
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
        {paid && hasEnoughCredits && imageUri && stage === 'cropped' && (
          <Pressable style={styles.primaryButton} onPress={startPackGeneration}>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Send my pup on an adventure</Text>
          </Pressable>
        )}

        {/* ---------- FREE flow ---------- */}
        {!paid && freeExhausted && (
          <View style={styles.paywall}>
            <Text style={styles.paywallTitle}>You've used your free portraits</Text>
            <Text style={styles.paywallBody}>
              Get a Pack of 12 for $9.99 to remove the watermark, or go Premium for daily portraits.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/upgrade')}>
              <Text style={styles.primaryButtonText}>Remove the watermark — see plans</Text>
            </Pressable>
          </View>
        )}

        {!paid && !freeExhausted && imageUri && freeImages.length === 0 && stage !== 'generating' && (
          <Pressable style={styles.primaryButton} onPress={() => generateFreeImage()}>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Create my free portrait</Text>
          </Pressable>
        )}

        {/* Generated free images */}
        {!paid && freeImages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your free set ({freeUsedCount} of {FREE_TOTAL})</Text>
            <View style={styles.resultGrid}>
              {freeImages.map((img, i) => (
                <View key={i} style={styles.resultItem}>
                  <Image source={{ uri: img.url }} style={styles.resultImage} contentFit="cover" />
                  <Text style={styles.resultLabel}>{img.label}</Text>
                </View>
              ))}
            </View>

            {!freeExhausted && (
              <>
                <Text style={styles.sectionSubtitle}>Add a scene (free):</Text>
                <View style={styles.themeGrid}>
                  {PREMIUM_BACKGROUNDS.filter((b) => b.id !== 'default' && !usedBackgrounds.includes(b.id)).map((bg) => (
                    <Pressable
                      key={bg.id}
                      style={[styles.themeChip, busy && { opacity: 0.5 }]}
                      disabled={busy}
                      onPress={() => generateFreeImage(bg)}
                    >
                      <Ionicons name="image-outline" size={16} color={colors.primary} />
                      <Text style={styles.themeLabel}>{bg.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Pressable style={styles.primaryButton} onPress={() => router.push('/upgrade')}>
              <Ionicons name="lock-open-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Remove the watermark — upgrade</Text>
            </Pressable>
          </>
        )}

        {busy && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{statusMessage}</Text>
            <Text style={styles.loadingHint}>
              {paid && stage === 'generating' ? 'This takes about 60–90 seconds.' : 'Just a few seconds…'}
            </Text>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.error}>
            <Ionicons name="warning-outline" size={32} color={'#c2453a'} />
            <Text style={styles.errorText}>{statusMessage}</Text>
            <Pressable style={styles.secondaryButton} onPress={reset}>
              <Text style={styles.secondaryButtonText}>Start over</Text>
            </Pressable>
          </View>
        )}

        {/* Paid: preview the 12 themes */}
        {paid && (
          <>
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
          </>
        )}

        {/* Privacy reassurance */}
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
    title: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 8 },
    subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted, marginBottom: 8 },
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
    placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
    placeholderText: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
    placeholderHint: { fontSize: 13, color: colors.muted, textAlign: 'center' },
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
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    secondaryButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    secondaryButtonText: { color: colors.text, fontSize: 14, fontWeight: '500' },
    paywall: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 14,
      padding: 18,
      gap: 10,
    },
    paywallTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    paywallBody: { fontSize: 14, lineHeight: 20, color: colors.muted },
    loading: { alignItems: 'center', gap: 10, padding: 18 },
    loadingText: { fontSize: 15, color: colors.text, fontWeight: '500', textAlign: 'center' },
    loadingHint: { fontSize: 12, color: colors.muted, textAlign: 'center' },
    error: { alignItems: 'center', gap: 10, padding: 18 },
    errorText: { fontSize: 14, color: '#c2453a', textAlign: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 12 },
    sectionSubtitle: { fontSize: 13, color: colors.muted, marginBottom: 8 },
    resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    resultItem: { width: '47%', gap: 4 },
    resultImage: { width: '100%', aspectRatio: 1, borderRadius: 12, backgroundColor: colors.card },
    resultLabel: { fontSize: 12, color: colors.muted, textAlign: 'center' },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    themeLabel: { fontSize: 13, color: colors.text },
    privacyCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginTop: 8,
    },
    privacyText: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.muted },
  });
}
