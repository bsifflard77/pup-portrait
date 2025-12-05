import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';
import { PRICING, formatPrice } from '@pup-portrait/shared';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
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
  };

  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-8">
        <Ionicons name="person-circle-outline" size={80} color="#6366f1" />
        <Text className="text-white text-xl font-semibold mt-4 text-center">
          Sign In to Continue
        </Text>
        <Text className="text-muted-foreground text-center mt-2 mb-6">
          Create an account to save portraits, track your creations, and unlock premium features.
        </Text>
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          className="bg-primary rounded-xl px-8 py-3 mb-3"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/signup')}>
          <Text className="text-primary">Create Account</Text>
        </Pressable>
      </View>
    );
  }

  const isPremium = user.subscriptionTier === 'premium' || user.subscriptionTier === 'lifetime';

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        {/* User Info */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-4">
            {user.avatarUrl ? (
              <Ionicons name="person" size={48} color="#6366f1" />
            ) : (
              <Text className="text-primary text-3xl font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text className="text-white text-xl font-semibold">
            {user.displayName || user.email}
          </Text>
          <View
            className={`mt-2 px-3 py-1 rounded-full ${
              isPremium ? 'bg-accent' : 'bg-muted'
            }`}
          >
            <Text className={`text-sm font-medium ${isPremium ? 'text-white' : 'text-muted-foreground'}`}>
              {user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1)} Plan
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row mb-6">
          <View className="flex-1 bg-card rounded-xl p-4 mr-2 items-center">
            <Text className="text-3xl font-bold text-primary">{user.totalGenerations}</Text>
            <Text className="text-muted-foreground text-sm">Total Created</Text>
          </View>
          <View className="flex-1 bg-card rounded-xl p-4 ml-2 items-center">
            <Text className="text-3xl font-bold text-primary">
              {isPremium ? '∞' : PRICING.FREE.dailyLimit - user.dailyGenerationsUsed}
            </Text>
            <Text className="text-muted-foreground text-sm">Today Remaining</Text>
          </View>
        </View>

        {/* Premium Upgrade */}
        {!isPremium && (
          <View className="bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="crown" size={24} color="#f59e0b" />
              <Text className="text-white font-semibold text-lg ml-2">Upgrade to Premium</Text>
            </View>
            <Text className="text-muted-foreground mb-4">
              Unlimited portraits, HD downloads, custom colors & backgrounds, and priority generation.
            </Text>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-white text-3xl font-bold">
                {formatPrice(PRICING.PREMIUM.monthlyPrice)}
              </Text>
              <Text className="text-muted-foreground">/month</Text>
            </View>
            <Pressable className="bg-accent rounded-xl p-4 items-center">
              <Text className="text-white font-semibold">Upgrade Now</Text>
            </Pressable>
          </View>
        )}

        {/* Menu Items */}
        <View className="bg-card rounded-xl overflow-hidden mb-6">
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => {}} />
          <MenuItem icon="shield-outline" label="Privacy Policy" onPress={() => {}} last />
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleLogout}
          className="bg-destructive/20 border border-destructive rounded-xl p-4 items-center"
        >
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-destructive font-semibold ml-2">Sign Out</Text>
          </View>
        </Pressable>

        {/* Version */}
        <Text className="text-muted-foreground text-center text-sm mt-6">
          Pup Portrait v0.1.0
        </Text>
      </View>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center p-4 ${!last ? 'border-b border-border' : ''}`}
    >
      <Ionicons name={icon as any} size={22} color="#a1a1aa" />
      <Text className="text-white flex-1 ml-3">{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
    </Pressable>
  );
}
