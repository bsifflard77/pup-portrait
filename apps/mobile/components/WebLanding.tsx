/**
 * WebLanding — premium desktop/web landing page.
 *
 * Created 2026-05-19 to replace the mobile-first form view that was being
 * shown on desktop. Renders only when Platform.OS === 'web' AND the viewport
 * is wider than 768px. Mobile users continue to see the old in-app form.
 *
 * Design language: Monomoy brand — navy + gold on cream — adapted for a
 * dog/pet consumer product. Playfair Display for headlines, Inter for body.
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth-store';
import { TIERS_DISPLAY } from '../lib/tiers-display';

const COLORS = {
  navy: '#0F1B35',
  navy2: '#1B2A4A',
  navy3: '#243557',
  gold: '#D4A843',
  goldDeep: '#b88b2b',
  paper: '#F7F5F0',
  cream: '#FFF4E6',
  ink: '#1A1F2E',
  mute: '#6B7280',
  line: '#E5E0D6',
};

// 2026-05-20 — real Nano Banana 2 generated portraits of one hero golden
// retriever across the 12 PACK_THEMES. Uploaded to Supabase Storage at
// portraits/marketing/. Regenerated via scripts/generate-marketing-samples.mjs.
const MARKETING_BUCKET =
  'https://rmalsvaoomhrgflioiqx.supabase.co/storage/v1/object/public/portraits/marketing';

const SAMPLE_PORTRAITS = [
  { id: 1, label: 'Watercolor Sunrise', imageUrl: `${MARKETING_BUCKET}/watercolor-sunrise.jpg` },
  { id: 2, label: 'Renaissance Noble', imageUrl: `${MARKETING_BUCKET}/renaissance-noble.jpg` },
  { id: 3, label: 'Pixar Sidekick', imageUrl: `${MARKETING_BUCKET}/pixar-sidekick.jpg` },
  { id: 4, label: 'Astronaut on the Moon', imageUrl: `${MARKETING_BUCKET}/astronaut-moon.jpg` },
  { id: 5, label: 'Pop Art', imageUrl: `${MARKETING_BUCKET}/pop-art.jpg` },
  { id: 6, label: 'Street Graffiti', imageUrl: `${MARKETING_BUCKET}/street-graffiti.jpg` },
  { id: 7, label: 'Pencil Sketch', imageUrl: `${MARKETING_BUCKET}/pencil-sketch.jpg` },
  { id: 8, label: 'Cyberpunk Neon', imageUrl: `${MARKETING_BUCKET}/cyberpunk-neon.jpg` },
  { id: 9, label: 'Studio Ghibli', imageUrl: `${MARKETING_BUCKET}/studio-ghibli.jpg` },
  { id: 10, label: 'Royal Portrait', imageUrl: `${MARKETING_BUCKET}/royal-portrait.jpg` },
  { id: 11, label: 'Holiday Festive', imageUrl: `${MARKETING_BUCKET}/holiday-festive.jpg` },
  { id: 12, label: 'Beach Vacation', imageUrl: `${MARKETING_BUCKET}/beach-vacation.jpg` },
];

export default function WebLanding() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [vw, setVw] = useState<number>(Dimensions.get('window').width);
  // 2026-05-20: SafeAreaView insets so iPhone notch + Android status bar
  // don't overlap the sticky nav when this component is used as the native
  // landing page. On web, insets are all 0.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setVw(window.width));
    return () => sub?.remove();
  }, []);

  const wide = vw >= 1024;
  const styles = makeStyles(wide);

  const go = (path: string) => () => router.push(path);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.pageContent, { paddingTop: insets.top }]}
    >
      {/* ============ TOP NAV ============ */}
      <View style={styles.nav}>
        <View style={styles.navInner}>
          <View style={styles.navBrand}>
            <View style={styles.brandLogo}>
              <Ionicons name="paw" size={20} color={COLORS.gold} />
            </View>
            <Text style={styles.brandName}>Pup Portrait</Text>
          </View>
          <View style={styles.navActions}>
            <Pressable onPress={go('/upgrade')}>
              <Text style={styles.navLink}>Pricing</Text>
            </Pressable>
            {isAuthenticated ? (
              <Pressable style={styles.navCta} onPress={go('/(tabs)/home')}>
                <Text style={styles.navCtaText}>Open app</Text>
              </Pressable>
            ) : (
              <>
                <Pressable onPress={go('/(auth)/login')}>
                  <Text style={styles.navLink}>Sign in</Text>
                </Pressable>
                <Pressable style={styles.navCta} onPress={go('/(auth)/signup')}>
                  <Text style={styles.navCtaText}>Get started free</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>

      {/* ============ HERO ============ */}
      <LinearGradient
        colors={[COLORS.navy, COLORS.navy2, COLORS.navy3]}
        style={styles.hero}
      >
        <View style={styles.heroInner}>
          <View style={styles.heroText}>
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>Powered by Google's Nano Banana 2 AI</Text>
            </View>
            <Text style={styles.heroHeadline}>
              Every dog. Every season.{'\n'}
              <Text style={styles.heroHeadlineItalic}>Brought to life.</Text>
            </Text>
            <Text style={styles.heroLede}>
              Upload a photo of your own dog — or pick any breed, any season, any scene.
              Photorealistic portraits in seconds.
            </Text>
            <View style={styles.heroCtas}>
              <Pressable style={styles.ctaPrimary} onPress={go(isAuthenticated ? '/(tabs)/upload' : '/(auth)/signup')}>
                <Ionicons name="cloud-upload-outline" size={18} color={COLORS.navy} />
                <Text style={styles.ctaPrimaryText}>Upload your dog's photo</Text>
              </Pressable>
              <Pressable style={styles.ctaGhost} onPress={go(isAuthenticated ? '/(tabs)/home' : '/(auth)/signup')}>
                <Text style={styles.ctaGhostText}>Free — 1 portrait + 5 scenes</Text>
              </Pressable>
            </View>
            <View style={styles.heroTrust}>
              <View style={styles.trustItem}>
                <Ionicons name="flash-outline" size={14} color={COLORS.gold} />
                <Text style={styles.trustText}>A full portrait pack in seconds</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.gold} />
                <Text style={styles.trustText}>Photo auto-deleted in 24h</Text>
              </View>
              <View style={styles.trustItem}>
                <Ionicons name="phone-portrait-outline" size={14} color={COLORS.gold} />
                <Text style={styles.trustText}>iPhone · Mac · Android · Web</Text>
              </View>
            </View>
          </View>

          {wide && (
            <View style={styles.heroVisual}>
              <View style={styles.sampleGrid}>
                {SAMPLE_PORTRAITS.slice(0, 4).map((s, idx) => (
                  <View
                    key={s.id}
                    style={[
                      styles.sampleTile,
                      idx === 0 && { transform: [{ rotate: '-3deg' }] },
                      idx === 1 && { transform: [{ rotate: '2deg' }, { translateY: 12 }] },
                      idx === 2 && { transform: [{ rotate: '3deg' }, { translateY: -8 }] },
                      idx === 3 && { transform: [{ rotate: '-2deg' }, { translateY: 4 }] },
                    ]}
                  >
                    <Image
                      source={{ uri: s.imageUrl }}
                      style={styles.sampleImage}
                      resizeMode="cover"
                    />
                    <View style={styles.sampleLabelBg} />
                    <Text style={styles.sampleLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ============ HOW IT WORKS ============ */}
      <View style={styles.section}>
        <View style={styles.sectionInner}>
          <Text style={styles.sectionKicker}>HOW IT WORKS</Text>
          <Text style={styles.sectionH2}>
            Three steps to a <Text style={styles.italic}>real portrait</Text>.
          </Text>
          <View style={styles.stepsRow}>
            {[
              { icon: 'paw-outline', t: 'Pick a dog', d: 'Choose from 100+ breeds, or upload a photo of your own dog.' },
              { icon: 'sparkles-outline', t: 'Pick a scene', d: 'Spring meadow, snowy Christmas, beach vacation — every season covered.' },
              { icon: 'share-social-outline', t: 'Get a real portrait', d: 'Photorealistic output in seconds. Download in HD, share, or print.' },
            ].map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{i + 1}</Text>
                </View>
                <Ionicons name={s.icon as any} size={28} color={COLORS.goldDeep} />
                <Text style={styles.stepTitle}>{s.t}</Text>
                <Text style={styles.stepDesc}>{s.d}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ============ SAMPLE GALLERY ============ */}
      <View style={[styles.section, { backgroundColor: COLORS.paper }]}>
        <View style={styles.sectionInner}>
          <Text style={styles.sectionKicker}>EVERY SEASON, EVERY SCENE</Text>
          <Text style={styles.sectionH2}>
            One dog. <Text style={styles.italic}>Every world you can imagine.</Text>
          </Text>
          <Text style={styles.sectionLede}>
            Spring blossoms, Halloween jack-o-lanterns, a snowy Christmas morning, a Renaissance
            oil painting, a cyberpunk skyline. Every Pack includes 12 photorealistic portraits of
            the same dog across twelve scenes.
          </Text>
          <View style={styles.galleryGrid}>
            {SAMPLE_PORTRAITS.map((s) => (
              <View key={s.id} style={styles.galleryItem}>
                <View style={styles.gallerySwatch}>
                  <Image
                    source={{ uri: s.imageUrl }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.galleryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ============ PRICING ============ */}
      <View style={[styles.section, { backgroundColor: COLORS.navy }]}>
        <View style={styles.sectionInner}>
          <Text style={[styles.sectionKicker, { color: COLORS.gold }]}>PRICING</Text>
          <Text style={[styles.sectionH2, { color: COLORS.cream }]}>
            Pick your <Text style={[styles.italic, { color: COLORS.gold }]}>plan</Text>.
          </Text>
          <Text style={[styles.sectionLede, { color: 'rgba(247,245,240,0.7)' }]}>
            One-time Pack, monthly subscription, or pay once for life. Cancel any time.
          </Text>
          <View style={styles.pricingGrid}>
            {TIERS_DISPLAY.map((t) => (
              <View
                key={t.id}
                style={[
                  styles.priceCard,
                  t.featured && { borderColor: COLORS.gold, borderWidth: 2 },
                ]}
              >
                {t.featured && (
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>MOST POPULAR</Text>
                  </View>
                )}
                <View style={styles.priceIcon}>
                  <Ionicons name={t.icon as any} size={22} color={COLORS.gold} />
                </View>
                <Text style={styles.priceTitle}>{t.title}</Text>
                <Text style={styles.priceAmount}>{t.priceLabel}</Text>
                <Text style={styles.priceSubtitle}>{t.subtitle}</Text>
                <View style={styles.priceBullets}>
                  {t.bullets.slice(0, 4).map((b, i) => (
                    <View key={i} style={styles.priceBullet}>
                      <Ionicons name="checkmark" size={14} color={COLORS.gold} />
                      <Text style={styles.priceBulletText}>{b}</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  style={[
                    styles.priceCta,
                    t.featured && { backgroundColor: COLORS.gold },
                  ]}
                  onPress={go(isAuthenticated ? '/upgrade' : '/(auth)/signup')}
                >
                  <Text
                    style={[
                      styles.priceCtaText,
                      t.featured && { color: COLORS.navy },
                    ]}
                  >
                    {t.cta}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ============ FINAL CTA ============ */}
      <View style={styles.section}>
        <View style={[styles.sectionInner, { alignItems: 'center' }]}>
          <Text style={styles.finalH2}>
            Which dog do you want to see <Text style={styles.italic}>brought to life</Text>?
          </Text>
          <Text style={styles.finalLede}>
            Start free — upload your dog and get one portrait plus five scenes, no credit card.
            Just $9.99 to remove the watermark when you love it.
          </Text>
          <Pressable
            style={[styles.ctaPrimary, { backgroundColor: COLORS.navy, marginTop: 24 }]}
            onPress={go(isAuthenticated ? '/(tabs)/home' : '/(auth)/signup')}
          >
            <Text style={[styles.ctaPrimaryText, { color: COLORS.cream }]}>
              {isAuthenticated ? 'Open the app' : 'Create your free account'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.gold} />
          </Pressable>
        </View>
      </View>

      {/* ============ FOOTER ============ */}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <View style={styles.footerLeft}>
            <View style={styles.brandLogo}>
              <Ionicons name="paw" size={16} color={COLORS.gold} />
            </View>
            <Text style={styles.footerCompany}>Pup Portrait by Monomoy Strategies LLC</Text>
          </View>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => router.push('/privacy' as any)}>
              <Text style={styles.footerLink}>Privacy</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/terms' as any)}>
              <Text style={styles.footerLink}>Terms</Text>
            </Pressable>
            <Text style={styles.footerLink}>support@pup-portrait.com</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(wide: boolean) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: COLORS.cream },
    pageContent: { paddingBottom: 0 },

    /* nav */
    nav: {
      position: Platform.OS === 'web' ? ('sticky' as any) : 'relative',
      top: 0,
      zIndex: 10,
      backgroundColor: 'rgba(255,244,230,0.92)',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
      ...(Platform.OS === 'web'
        ? ({ backdropFilter: 'blur(10px)' } as any)
        : {}),
    },
    navInner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: 32,
      paddingVertical: 18,
    },
    navBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    brandLogo: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.navy,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandName: {
      fontSize: 17,
      fontWeight: '700',
      color: COLORS.navy,
      letterSpacing: -0.3,
    },
    navActions: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    navLink: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
    navCta: {
      backgroundColor: COLORS.navy,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 8,
    },
    navCtaText: { color: COLORS.cream, fontSize: 14, fontWeight: '600' },

    /* hero */
    hero: { paddingVertical: wide ? 96 : 64, paddingHorizontal: 32 },
    heroInner: {
      flexDirection: wide ? 'row' : 'column',
      alignItems: 'center',
      gap: wide ? 64 : 48,
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    },
    heroText: { flex: 1, maxWidth: 620 },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: 'rgba(212,168,67,0.12)',
      borderRadius: 99,
      borderWidth: 1,
      borderColor: 'rgba(212,168,67,0.3)',
      marginBottom: 24,
    },
    heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
    heroBadgeText: { color: COLORS.gold, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
    heroHeadline: {
      fontSize: wide ? 64 : 44,
      fontWeight: '800',
      color: COLORS.cream,
      lineHeight: wide ? 70 : 50,
      letterSpacing: -1.2,
      marginBottom: 20,
    },
    heroHeadlineItalic: { fontStyle: 'italic', color: COLORS.gold, fontWeight: '700' },
    heroLede: {
      fontSize: wide ? 18 : 16,
      color: 'rgba(247,245,240,0.78)',
      lineHeight: 28,
      marginBottom: 32,
    },
    heroCtas: { flexDirection: wide ? 'row' : 'column', gap: 12, marginBottom: 28 },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: COLORS.gold,
      paddingHorizontal: 22,
      paddingVertical: 16,
      borderRadius: 10,
      ...(Platform.OS === 'web'
        ? ({ cursor: 'pointer', transition: 'transform 0.15s' } as any)
        : {}),
    },
    ctaPrimaryText: { color: COLORS.navy, fontSize: 15, fontWeight: '700' },
    ctaGhost: {
      paddingHorizontal: 22,
      paddingVertical: 16,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: 'rgba(247,245,240,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
    },
    ctaGhostText: { color: COLORS.cream, fontSize: 15, fontWeight: '600' },
    heroTrust: { flexDirection: wide ? 'row' : 'column', gap: 18 },
    trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    trustText: { color: 'rgba(247,245,240,0.6)', fontSize: 12 },

    heroVisual: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sampleGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      maxWidth: 480,
      justifyContent: 'center',
    },
    sampleTile: {
      width: 220,
      height: 220,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: COLORS.navy2,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: '0 20px 60px rgba(0,0,0,0.35)' } as any)
        : {}),
    },
    sampleImage: {
      width: '100%',
      height: '100%',
    },
    sampleLabelBg: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 64,
      backgroundColor: 'rgba(15,27,53,0.55)',
    },
    sampleLabel: {
      position: 'absolute',
      bottom: 14,
      left: 14,
      right: 14,
      color: 'rgba(255,255,255,0.98)',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },

    /* sections */
    section: { paddingVertical: wide ? 96 : 56, paddingHorizontal: 32 },
    sectionInner: { maxWidth: 1200, width: '100%', alignSelf: 'center' },
    sectionKicker: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 2,
      color: COLORS.goldDeep,
      marginBottom: 12,
    },
    sectionH2: {
      fontSize: wide ? 42 : 30,
      fontWeight: '700',
      color: COLORS.navy,
      letterSpacing: -1,
      lineHeight: wide ? 50 : 38,
      marginBottom: 16,
      maxWidth: 720,
    },
    italic: { fontStyle: 'italic', color: COLORS.goldDeep },
    sectionLede: {
      fontSize: 17,
      color: COLORS.mute,
      lineHeight: 26,
      maxWidth: 620,
      marginBottom: 40,
    },

    /* steps */
    stepsRow: {
      flexDirection: wide ? 'row' : 'column',
      gap: 20,
      marginTop: 16,
    },
    stepCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 28,
      borderWidth: 1,
      borderColor: COLORS.line,
      gap: 14,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: '0 4px 24px rgba(15,27,53,0.06)' } as any)
        : {}),
    },
    stepNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: COLORS.navy,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberText: { color: COLORS.gold, fontWeight: '700', fontSize: 15 },
    stepTitle: { fontSize: 19, fontWeight: '700', color: COLORS.navy },
    stepDesc: { fontSize: 14, color: COLORS.mute, lineHeight: 22 },

    /* gallery */
    galleryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 8,
    },
    galleryItem: {
      width: wide ? 200 : 150,
      gap: 8,
    },
    gallerySwatch: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: COLORS.navy2,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: '0 8px 20px rgba(15,27,53,0.10)' } as any)
        : {}),
    },
    galleryImage: {
      width: '100%',
      height: '100%',
    },
    galleryLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.ink,
      textAlign: 'center',
    },

    /* pricing */
    pricingGrid: {
      flexDirection: wide ? 'row' : 'column',
      gap: 16,
      marginTop: 16,
      flexWrap: 'wrap',
    },
    priceCard: {
      flex: wide ? 1 : undefined,
      minWidth: 220,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(247,245,240,0.15)',
      gap: 10,
      position: 'relative',
    },
    priceBadge: {
      position: 'absolute',
      top: -12,
      left: 20,
      backgroundColor: COLORS.gold,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
    },
    priceBadgeText: {
      color: COLORS.navy,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
    },
    priceIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: 'rgba(212,168,67,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    priceTitle: { fontSize: 16, fontWeight: '700', color: COLORS.cream },
    priceAmount: { fontSize: 22, fontWeight: '700', color: COLORS.gold },
    priceSubtitle: { fontSize: 12, color: 'rgba(247,245,240,0.65)', lineHeight: 18 },
    priceBullets: { gap: 6, marginTop: 6, marginBottom: 14 },
    priceBullet: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    priceBulletText: { fontSize: 12, color: 'rgba(247,245,240,0.85)', flex: 1 },
    priceCta: {
      paddingVertical: 11,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.gold,
      alignItems: 'center',
      ...(Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}),
    },
    priceCtaText: { color: COLORS.gold, fontSize: 13, fontWeight: '600' },

    /* final cta */
    finalH2: {
      fontSize: wide ? 44 : 32,
      fontWeight: '700',
      color: COLORS.navy,
      letterSpacing: -1,
      textAlign: 'center',
      marginBottom: 12,
    },
    finalLede: {
      fontSize: 17,
      color: COLORS.mute,
      textAlign: 'center',
      maxWidth: 520,
    },

    /* footer */
    footer: {
      borderTopWidth: 1,
      borderTopColor: COLORS.line,
      paddingVertical: 32,
      paddingHorizontal: 32,
      backgroundColor: COLORS.paper,
    },
    footerInner: {
      flexDirection: wide ? 'row' : 'column',
      justifyContent: 'space-between',
      alignItems: wide ? 'center' : 'flex-start',
      gap: 16,
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
    },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    footerCompany: { fontSize: 13, color: COLORS.mute },
    footerLinks: { flexDirection: 'row', gap: 24 },
    footerLink: { fontSize: 13, color: COLORS.mute },
  });
}
