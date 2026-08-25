import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth-store';
import { TIERS_DISPLAY } from '../lib/tiers-display';
import { SiteNav } from '../components/SiteNav';

const COLORS = {
  navy: '#0F1B35',
  gold: '#D4A843',
  cream: '#FFF4E6',
  mute: '#6B7280',
  line: '#E5E0D6',
};

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <Stack.Screen options={{ title: 'Pricing', headerShown: false }} />
      <ScrollView style={styles.page} contentContainerStyle={styles.content} testID="pricing-page">
        <SiteNav />
        <View style={styles.inner}>
          <Text style={styles.kicker}>PRICING</Text>
          <Text style={styles.h1}>Pick your plan.</Text>
          <Text style={styles.lede}>
            One-time Pack, monthly subscription, or pay once for life. Cancel any time.
            Start free with 1 watermarked portrait + 5 scenes.
          </Text>

          <View style={styles.grid}>
            {TIERS_DISPLAY.map((t) => (
              <View
                key={t.id}
                style={[styles.card, t.featured && styles.cardFeatured]}
              >
                {t.featured && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={styles.icon}>
                  <Ionicons name={t.icon as any} size={22} color={COLORS.gold} />
                </View>
                <Text style={styles.title}>{t.title}</Text>
                <Text style={styles.amount}>{t.priceLabel}</Text>
                <Text style={styles.subtitle}>{t.subtitle}</Text>
                <View style={styles.bullets}>
                  {t.bullets.map((b, i) => (
                    <View key={i} style={styles.bullet}>
                      <Ionicons name="checkmark" size={14} color={COLORS.gold} />
                      <Text style={styles.bulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={[styles.cta, t.featured && styles.ctaFeatured]}
                  onPress={() => router.push(isAuthenticated ? '/upgrade' : '/(auth)/signup')}
                >
                  <Text style={[styles.ctaText, t.featured && styles.ctaTextFeatured]}>
                    {t.cta}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.cream },
  content: { paddingBottom: 48 },
  inner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  kicker: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  h1: {
    color: COLORS.navy,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
    ...(Platform.OS === 'web' ? { fontFamily: 'Georgia, serif' } : {}),
  },
  lede: {
    color: COLORS.mute,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
    maxWidth: 640,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    flexGrow: 1,
    flexBasis: 240,
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(247,245,240,0.15)',
    gap: 10,
    position: 'relative',
  },
  cardFeatured: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(212,168,67,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.cream },
  amount: { fontSize: 22, fontWeight: '700', color: COLORS.gold },
  subtitle: { fontSize: 13, lineHeight: 18, color: 'rgba(247,245,240,0.7)' },
  bullets: { gap: 8, marginTop: 4 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 18, color: 'rgba(247,245,240,0.85)' },
  cta: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(247,245,240,0.25)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaFeatured: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  ctaText: { color: COLORS.cream, fontWeight: '700', fontSize: 14 },
  ctaTextFeatured: { color: COLORS.navy },
});
