import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/theme-store';

// Branded header logo — matches the WebLanding nav (paw in a navy circle +
// "Pup Portrait" wordmark in gold/cream). Used as the tabs headerTitle so the
// in-app top bar feels like a continuation of the landing page.
function BrandHeader({ subtitle }: { subtitle?: string }) {
  const { colors } = useThemeStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#0F1B35',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.primary,
        }}
      >
        <Ionicons name="paw" size={18} color={colors.primary} />
      </View>
      <View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
          Pup Portrait
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: -2 }}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerTitleAlign: 'left' as const,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Create',
          headerTitle: () => <BrandHeader />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Your Dog',
          headerTitle: () => <BrandHeader subtitle="Send your pup on an adventure" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="camera" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          headerTitle: () => <BrandHeader subtitle="Your portraits" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: () => <BrandHeader subtitle="Account" />,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
