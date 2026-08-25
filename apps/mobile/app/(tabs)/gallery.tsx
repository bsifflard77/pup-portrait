import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePortraitStore } from '../../store/portrait-store';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import type { Portrait } from '@pup-portrait/shared';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const maxWidth = isWeb ? 480 : screenWidth;

export default function GalleryPage() {
  const { user } = useAuthStore();
  const { recentPortraits, fetchUserPortraits } = usePortraitStore();
  const { colors } = useThemeStore();

  useEffect(() => {
    if (user) {
      fetchUserPortraits();
    }
  }, [user]);

  if (!user) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="images-outline" size={80} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Your Gallery</Text>
        <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
          Sign in to save and view your portrait collection
        </Text>
      </View>
    );
  }

  if (recentPortraits.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="paw" size={80} color={colors.primary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Portraits Yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
          Generate your first portrait to start your collection!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={recentPortraits}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PortraitCard portrait={item} colors={colors} />}
      />
    </View>
  );
}

function PortraitCard({ portrait, colors }: { portrait: Portrait; colors: any }) {
  return (
    <Pressable style={[styles.card, { backgroundColor: colors.card }]}>
      <Image
        source={{ uri: portrait.imageUrl }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardBreed, { color: colors.text }]} numberOfLines={1}>
          {portrait.breed}
        </Text>
        <Text style={[styles.cardDate, { color: colors.muted }]}>
          {new Date(portrait.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 8,
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
  },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
  },
  cardInfo: {
    padding: 12,
  },
  cardBreed: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 12,
    marginTop: 2,
  },
});
