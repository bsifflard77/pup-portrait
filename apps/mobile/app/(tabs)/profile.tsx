import { View, Text, Pressable, ScrollView, Alert, StyleSheet, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { PRICING, formatPrice } from '@pup-portrait/shared';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const maxWidth = isWeb ? 480 : screenWidth;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { colors } = useThemeStore();

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      await logout();
      router.replace('/');
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="person-circle-outline" size={80} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Sign In to Continue</Text>
        <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
          Create an account to save portraits, track your creations, and unlock premium features.
        </Text>
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/signup')}>
          <Text style={[styles.linkText, { color: colors.primary }]}>Create Account</Text>
        </Pressable>
      </View>
    );
  }

  const isPremium = user.subscriptionTier === 'premium' || user.subscriptionTier === 'lifetime';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user.displayName || user.email}
          </Text>
          <View style={[styles.tierBadge, { backgroundColor: isPremium ? colors.accent : colors.muted }]}>
            <Text style={styles.tierBadgeText}>
              {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)} Plan
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{user.totalGenerations}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total Created</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {isPremium
                ? `${Math.max(0, PRICING.PREMIUM.dailyLimit - user.dailyGenerationsUsed)}`
                : `${Math.max(0, PRICING.FREE.freeTotalImages - user.freeImagesUsed)}`}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>
              {isPremium ? 'Today Remaining' : 'Free Left'}
            </Text>
          </View>
        </View>

        {/* Premium Upgrade */}
        {!isPremium && (
          <View style={[styles.upgradeCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <View style={styles.upgradeHeader}>
              <Ionicons name="star" size={24} color={colors.accent} />
              <Text style={[styles.upgradeTitle, { color: colors.text }]}>Upgrade to Premium</Text>
            </View>
            <Text style={[styles.upgradeDesc, { color: colors.muted }]}>
              15 portraits daily, HD downloads, custom colors & backgrounds, and all breeds.
            </Text>
            <View style={styles.upgradePricing}>
              <Text style={[styles.upgradePrice, { color: colors.text }]}>
                {formatPrice(PRICING.PREMIUM.monthlyPrice)}
              </Text>
              <Text style={[styles.upgradePeriod, { color: colors.muted }]}>/month</Text>
            </View>
            <Text style={[styles.lifetimeOption, { color: colors.muted }]}>
              Or {formatPrice(PRICING.LIFETIME.price)} one-time (lifetime access)
            </Text>
            <Pressable style={[styles.upgradeButton, { backgroundColor: colors.accent }]}>
              <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
            </Pressable>
          </View>
        )}

        {/* Menu Items */}
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          <MenuItem icon="person-outline" label="Edit Profile" colors={colors} onPress={() => {}} />
          <MenuItem icon="notifications-outline" label="Notifications" colors={colors} onPress={() => {}} />
          <MenuItem icon="help-circle-outline" label="Help & Support" colors={colors} onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Terms of Service" colors={colors} onPress={() => router.push('/terms' as any)} />
          <MenuItem icon="shield-outline" label="Privacy Policy" colors={colors} onPress={() => router.push('/privacy' as any)} last />
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleLogout}
          style={[styles.logoutButton, { borderColor: colors.destructive }]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </Pressable>

        {/* Version */}
        <Text style={[styles.version, { color: colors.muted }]}>Pup Portrait v0.1.0</Text>
      </View>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  colors,
  onPress,
  last = false,
}: {
  icon: string;
  label: string;
  colors: any;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.menuItem, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
    >
      <Ionicons name={icon as any} size={22} color={colors.muted} />
      <Text style={[styles.menuItemText, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    maxWidth: maxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  linkText: {
    fontWeight: '500',
    fontSize: 14,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
  },
  tierBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tierBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  upgradeCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  upgradeDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  upgradePricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  upgradePrice: {
    fontSize: 28,
    fontWeight: '700',
  },
  upgradePeriod: {
    fontSize: 14,
  },
  lifetimeOption: {
    fontSize: 13,
    marginBottom: 16,
  },
  upgradeButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    fontWeight: '600',
    fontSize: 14,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
