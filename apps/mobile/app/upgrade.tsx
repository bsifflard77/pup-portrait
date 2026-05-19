/**
 * /upgrade — customer-facing checkout entry point.
 *
 * Created 2026-05-19 as part of the relaunch. Lists the five paid tiers as
 * tappable cards. Tapping a card hits the `create-checkout` Edge Function,
 * receives a Stripe Checkout URL, and opens it in an in-app browser
 * (SFSafariViewController on iOS — required for Apple's reader-app model).
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
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';
import { TIERS_DISPLAY, type TierCheckoutPlan } from '../lib/tiers-display';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const maxWidth = isWeb ? 540 : screenWidth;

export default function UpgradeScreen() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { colors } = useThemeStore();
  const [pendingPlan, setPendingPlan] = useState<TierCheckoutPlan | null>(null);

  const startCheckout = async (planType: TierCheckoutPlan) => {
    if (!user || !accessToken) {
      Alert.alert('Sign in first', 'Create a free account or sign in to upgrade.');
      return;
    }

    setPendingPlan(planType);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          // For web, return to /upgrade with a success flag. For native, the
          // user comes back to the app via universal link / app schemes —
          // we land them on /(tabs)/profile where the new tier is reflected.
          successUrl: isWeb
            ? `${window.location.origin}/upgrade?checkout=success`
            : 'https://pup-portrait.com/checkout-success',
          cancelUrl: isWeb
            ? `${window.location.origin}/upgrade?checkout=canceled`
            : 'https://pup-portrait.com/checkout-canceled',
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload.url) {
        throw new Error(payload.message || payload.error || `Checkout failed (HTTP ${res.status})`);
      }

      // Open Stripe Checkout — in-app browser on native, redirect on web.
      if (isWeb) {
        window.location.href = payload.url;
      } else {
        await WebBrowser.openBrowserAsync(payload.url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      Alert.alert('Could not start checkout', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPendingPlan(null);
    }
  };

  const styles = makeStyles(colors);

  return (
    <>
      <Stack.Screen options={{ title: 'Upgrade Pup Portrait', headerBackTitle: 'Back' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.inner}>
          <Text style={styles.title}>Pick your plan.</Text>
          <Text style={styles.subtitle}>
            Five ways to make your dog famous. Switch or cancel any time.
          </Text>

          {TIERS_DISPLAY.map((t) => {
            const isCurrent = user?.subscriptionTier === t.matchesTier;
            const isPending = pendingPlan === t.checkoutPlan;
            return (
              <View
                key={t.id}
                style={[
                  styles.card,
                  t.featured && { borderColor: colors.primary, borderWidth: 2 },
                  isCurrent && { opacity: 0.6 },
                ]}
              >
                {t.featured && <Text style={styles.badge}>Most popular</Text>}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name={t.icon as any} size={22} color={colors.primary} />
                    <Text style={styles.cardTitle}>{t.title}</Text>
                  </View>
                  <Text style={styles.cardPrice}>{t.priceLabel}</Text>
                </View>
                <Text style={styles.cardSubtitle}>{t.subtitle}</Text>
                <View style={styles.bullets}>
                  {t.bullets.map((b, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={[
                    styles.button,
                    { backgroundColor: t.featured ? colors.primary : colors.card, borderColor: colors.primary, borderWidth: t.featured ? 0 : 1 },
                    isCurrent && { backgroundColor: colors.border },
                  ]}
                  disabled={isCurrent || isPending}
                  onPress={() => startCheckout(t.checkoutPlan)}
                >
                  {isPending ? (
                    <ActivityIndicator color={t.featured ? '#fff' : colors.primary} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        { color: t.featured ? '#fff' : colors.primary },
                      ]}
                    >
                      {isCurrent ? 'Your current plan' : t.cta}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}

          {/* Reader-app disclosure (Apple guideline 3.1.1(a) compliance) */}
          {Platform.OS === 'ios' && (
            <View style={styles.disclosure}>
              <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              <Text style={styles.disclosureText}>
                On iPhone and iPad, payments are processed via our website at
                pup-portrait.com. Your purchase will sync to this app automatically.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: 20, alignItems: 'center' },
    inner: { width: '100%', maxWidth, gap: 16 },
    title: {
      fontSize: 30,
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
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      top: -10,
      left: 16,
      backgroundColor: colors.primary,
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 4,
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    cardPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },
    cardSubtitle: { fontSize: 13, color: colors.muted, lineHeight: 18 },
    bullets: { gap: 6, marginTop: 4 },
    bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bulletText: { fontSize: 14, color: colors.text, flex: 1 },
    button: {
      marginTop: 10,
      paddingVertical: 13,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonText: { fontSize: 15, fontWeight: '600' },
    disclosure: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 12,
      marginTop: 8,
    },
    disclosureText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
      color: colors.muted,
    },
  });
}
