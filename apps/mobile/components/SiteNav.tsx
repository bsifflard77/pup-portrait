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

export function SiteNav() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [vw, setVw] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setVw(window.width));
    return () => sub?.remove();
  }, []);

  const compact = vw < COMPACT_BREAKPOINT;
  const styles = makeStyles(compact);
  const go = (path: string) => () => router.push(path as any);

  return (
    <View style={styles.nav} testID="site-nav">
      <View style={styles.navInner}>
        <Pressable onPress={go('/')} style={styles.navBrand} accessibilityRole="link">
          <View style={styles.brandLogo}>
            <Ionicons name="paw" size={20} color={COLORS.gold} />
          </View>
          <Text style={styles.brandName}>Pup Portrait</Text>
        </Pressable>
        <View style={styles.navActions}>
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
                <Text style={styles.navCtaText}>Get started free</Text>
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
      backgroundColor: 'rgba(255,244,230,0.92)',
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
      ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(10px)' } as any) : {}),
    },
    navInner: {
      flexDirection: compact ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: compact ? 'stretch' : 'center',
      maxWidth: 1200,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: compact ? 16 : 32,
      paddingVertical: compact ? 12 : 18,
      gap: compact ? 10 : 0,
    },
    navBrand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 0,
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
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: compact ? 10 : 24,
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
