import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth-store';
import { usePortraitStore } from '../store/portrait-store';
import { hasGuestUsedFreeTrial } from '../lib/guest-tracker';
import { BREEDS, FREE_BREEDS, getRandomBreed } from '@pup-portrait/shared';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { currentPortrait, isGenerating, generatePortrait, error } = usePortraitStore();

  const [selectedBreed, setSelectedBreed] = useState('random');
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [showBreedPicker, setShowBreedPicker] = useState(false);

  useEffect(() => {
    // Check if user has used their guest trial
    hasGuestUsedFreeTrial().then(setHasUsedTrial);
  }, []);

  useEffect(() => {
    // If authenticated, redirect to main app
    if (!authLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, authLoading]);

  const handleGenerate = async () => {
    if (hasUsedTrial) {
      // Show signup prompt
      router.push('/(auth)/signup');
      return;
    }

    const breed = selectedBreed === 'random' ? getRandomBreed().id : selectedBreed;
    await generatePortrait({ breed }, true);
    setHasUsedTrial(true);
  };

  const getBreedName = (id: string) => {
    return BREEDS.find((b) => b.id === id)?.name || 'Random Breed';
  };

  if (authLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-8">
        {/* Header */}
        <View className="items-center mb-8">
          <Text className="text-4xl font-bold text-white mb-2">Pup Portrait</Text>
          <Text className="text-muted-foreground text-center text-lg">
            Create stunning AI portraits of your dream dog
          </Text>
        </View>

        {/* Breed Selector */}
        <View className="mb-6">
          <Text className="text-white font-medium mb-2">Select a breed:</Text>
          <Pressable
            onPress={() => setShowBreedPicker(!showBreedPicker)}
            className="bg-card border border-border rounded-xl p-4 flex-row items-center justify-between"
          >
            <Text className="text-white text-lg">{getBreedName(selectedBreed)}</Text>
            <Ionicons name="chevron-down" size={24} color="#a1a1aa" />
          </Pressable>

          {showBreedPicker && (
            <View className="bg-card border border-border rounded-xl mt-2 max-h-64">
              <ScrollView>
                {FREE_BREEDS.map((breed) => (
                  <Pressable
                    key={breed.id}
                    onPress={() => {
                      setSelectedBreed(breed.id);
                      setShowBreedPicker(false);
                    }}
                    className={`p-4 border-b border-border ${
                      selectedBreed === breed.id ? 'bg-primary/20' : ''
                    }`}
                  >
                    <Text className="text-white">{breed.name}</Text>
                    <Text className="text-muted-foreground text-sm">{breed.description}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Portrait Display */}
        <View className="bg-card rounded-2xl overflow-hidden mb-6">
          {isGenerating ? (
            <View className="aspect-square items-center justify-center">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-muted-foreground mt-4">Creating your portrait...</Text>
            </View>
          ) : currentPortrait ? (
            <View>
              <Image
                source={{ uri: currentPortrait.imageUrl }}
                className="w-full aspect-square"
                contentFit="cover"
              />
              <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-4">
                <Text className="text-white font-semibold text-lg">
                  Meet {currentPortrait.name || 'Your Pup'}
                </Text>
                <Text className="text-white/80">{currentPortrait.breed}</Text>
              </View>
              {/* Watermark indicator */}
              <View className="absolute top-3 left-3 bg-accent/90 rounded-lg px-3 py-1">
                <Text className="text-white text-xs font-medium">PREVIEW</Text>
              </View>
            </View>
          ) : (
            <View className="aspect-square items-center justify-center p-8">
              <Ionicons name="paw" size={80} color="#6366f1" />
              <Text className="text-white text-xl font-semibold mt-4 text-center">
                Your Dream Dog Awaits
              </Text>
              <Text className="text-muted-foreground text-center mt-2">
                Select a breed and tap generate to create your perfect pup portrait
              </Text>
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View className="bg-destructive/20 border border-destructive rounded-xl p-4 mb-6">
            <Text className="text-destructive">{error}</Text>
          </View>
        )}

        {/* Generate Button */}
        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating}
          className={`rounded-xl p-4 items-center mb-4 ${
            isGenerating ? 'bg-primary/50' : 'bg-primary'
          }`}
        >
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={20} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">
              {hasUsedTrial ? 'Sign Up to Continue' : 'Generate Free Portrait'}
            </Text>
          </View>
        </Pressable>

        {!hasUsedTrial && (
          <Text className="text-muted-foreground text-center text-sm mb-6">
            No signup required for your first portrait!
          </Text>
        )}

        {/* Signup Prompt (after first generation) */}
        {hasUsedTrial && currentPortrait && (
          <View className="bg-card border border-primary/30 rounded-2xl p-6 mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="gift" size={24} color="#f59e0b" />
              <Text className="text-white font-semibold text-lg ml-2">
                Love it? Get more!
              </Text>
            </View>
            <Text className="text-muted-foreground mb-4">
              Sign up FREE to get 3 portraits per day, save your favorites, and access on any device.
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              className="bg-primary rounded-xl p-3 items-center mb-3"
            >
              <Text className="text-white font-semibold">Create Free Account</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              className="items-center"
            >
              <Text className="text-primary">Already have an account? Sign in</Text>
            </Pressable>
          </View>
        )}

        {/* Features */}
        <View className="mt-4">
          <Text className="text-white font-semibold text-lg mb-4 text-center">
            Why Pup Portrait?
          </Text>
          <View className="space-y-4">
            <FeatureCard
              icon="flash"
              title="Lightning Fast"
              description="Generate stunning portraits in seconds"
            />
            <FeatureCard
              icon="heart"
              title="Your Perfect Dog"
              description="Create the exact dog you've always dreamed of"
            />
            <FeatureCard
              icon="download"
              title="Save & Share"
              description="Download HD portraits to share with friends"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-center bg-card rounded-xl p-4 mb-3">
      <View className="w-12 h-12 bg-primary/20 rounded-xl items-center justify-center">
        <Ionicons name={icon as any} size={24} color="#6366f1" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-white font-semibold">{title}</Text>
        <Text className="text-muted-foreground text-sm">{description}</Text>
      </View>
    </View>
  );
}
