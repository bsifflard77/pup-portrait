import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth-store';

const COLORS = {
  navy: '#0F1B35',
  gold: '#D4A843',
  cream: '#FFF4E6',
  ink: '#1A1F2E',
  line: '#E5E0D6',
};

const COMPACT_BREAKPOINT = 720;

function readViewportWidth(): number {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.innerWidth;
  }
  return Dimensions.get('window').width;
}

export function SiteNav() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [vw, setVw] = useState(readViewportWidth);

  useEffect(() => {
    const onResize = () => setVw(readViewportWidth());
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('resize', onResize);
      onResize();
      return () => window.removeEventListener('resize', onResize);
    }
    const sub = Dimensions.addEventListener('change', onResize);
    return () => sub?.remove();
  }, []);

  const compact = vw < COMPACT_BREAKPOINT;
  const styles = makeStyles(compact);
  const go = (path: string) => () => router.push(path as any);

  return (
    <View style={styles.nav} testID="site-nav">
      {Platform.OS === 'web' ? (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .site-nav-inner { display: flex; flex-wrap: wrap; width: 100%; box-sizing: border-box; }
              @media (max-width: 719px) {
                .site-nav-inner {
                  flex-direction: column !important;
                  align-items: flex-start !important;
                  justify-content: flex-start !important;
                  padding-left: 16px !important;
                  padding-right: 16px !important;
                  row-gap: 10px !important;
                }
                .site-nav-actions { gap: 12px !important; }
              }
            `,
          }}
        />
      ) : null}
      <View
        style={styles.navInner}
        {...(Platform.OS === 'web' ? { className: 'site-nav-inner' } : {})}
      >
        <Pressable onPress={go('/')} style={styles.navBrand} accessibilityRole="link">
          <View style={styles.brandLogo}>
            <Ionicons name="paw" size={20} color={COLORS.gold} />
          </View>
          <Text style={styles.brandName} numberOfLines={1}>
            Pup Portrait
          </Text>
        </Pressable>
        <View
          style={styles.navActions}
          {...(Platform.OS === 'web' ? { className: 'site-nav-actions' } : {})}
        >
          <Pressable onPress={go('/pricing')} style={styles.navLinkHit}>
            <Text style={styles.navLink}>Pricing</Text>
          </Pressable>
          {isAuthenticated ? (
            <Pressable style={styles.navCta} onPress={go('/(tabs)/home')}>
              <Text style={styles.navCtaText}>Open app</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={go('/(auth)/login')} style={styles.navLinkHit}>
                <Text style={styles.navLink}>Sign in</Text>
              </Pressable>
              <Pressable style={styles.navCta} onPress={go('/(auth)/signup')}>
                <Text style={styles.navCtaText} numberOfLines={1}>
                  Get started free
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function makeStyles(compact: boolean) {
  return StyleSheet.create({
    nav: {
      position: Platform.OS === 'web' ? ('sticky' as any) : 'relative',
      top: 0,
      zIndex: 10,
      width: '100%',
      backgroundColor: 'rgba(255,244,230,0.92)',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
      ...(Platform.OS === 'web'
        ? ({ backdropFilter: 'blur(10px)', boxSizing: 'border-box' } as any)
        : {}),
    },
    navInner: {
      // Always wrap: on web, Dimensions often reports the desktop window
      // while Chrome device-mode is 390px, which is what caused
      // "Pup PortraitPricing" + a clipped CTA on the live homepage.
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: compact ? 'flex-start' : 'space-between',
      alignItems: 'center',
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: compact ? 16 : 32,
      paddingVertical: compact ? 12 : 18,
      columnGap: compact ? 12 : 24,
      rowGap: 10,
    },
    navBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 0,
      marginRight: 12,
    },
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
    navActions: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      gap: compact ? 12 : 24,
      flexShrink: 0,
    },
    navLinkHit: {
      paddingVertical: 4,
      paddingHorizontal: 2,
      flexShrink: 0,
    },
    navLink: { fontSize: 14, fontWeight: '500', color: COLORS.ink },
    navCta: {
      backgroundColor: COLORS.navy,
      paddingHorizontal: compact ? 12 : 18,
      paddingVertical: compact ? 8 : 10,
      borderRadius: 8,
      flexShrink: 0,
    },
    navCtaText: { color: COLORS.cream, fontSize: 14, fontWeight: '600' },
  });
}
