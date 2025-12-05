import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePortraitStore } from '../../store/portrait-store';
import { useAuthStore } from '../../store/auth-store';
import type { Portrait } from '@pup-portrait/shared';

export default function GalleryPage() {
  const { user } = useAuthStore();
  const { recentPortraits, fetchUserPortraits } = usePortraitStore();

  useEffect(() => {
    if (user) {
      fetchUserPortraits();
    }
  }, [user]);

  if (!user) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-8">
        <Ionicons name="images-outline" size={80} color="#6366f1" />
        <Text className="text-white text-xl font-semibold mt-4 text-center">
          Your Gallery
        </Text>
        <Text className="text-muted-foreground text-center mt-2">
          Sign in to save and view your portrait collection
        </Text>
      </View>
    );
  }

  if (recentPortraits.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-8">
        <Ionicons name="paw" size={80} color="#6366f1" />
        <Text className="text-white text-xl font-semibold mt-4 text-center">
          No Portraits Yet
        </Text>
        <Text className="text-muted-foreground text-center mt-2">
          Generate your first portrait to start your collection!
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={recentPortraits}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PortraitCard portrait={item} />}
      />
    </View>
  );
}

function PortraitCard({ portrait }: { portrait: Portrait }) {
  return (
    <Pressable className="flex-1 m-2 bg-card rounded-xl overflow-hidden">
      <Image
        source={{ uri: portrait.imageUrl }}
        className="w-full aspect-square"
        contentFit="cover"
      />
      <View className="p-3">
        <Text className="text-white font-medium" numberOfLines={1}>
          {portrait.breed}
        </Text>
        <Text className="text-muted-foreground text-xs">
          {new Date(portrait.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
}
