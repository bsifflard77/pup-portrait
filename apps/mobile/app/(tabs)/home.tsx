import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';
import { usePortraitStore } from '../../store/portrait-store';
import {
  BREEDS,
  FREE_BREEDS,
  PREMIUM_BREEDS,
  PREMIUM_COLORS,
  PREMIUM_BACKGROUNDS,
  getRandomBreed,
  PRICING,
  getRemainingGenerations,
} from '@pup-portrait/shared';

export default function HomePage() {
  const { user } = useAuthStore();
  const { currentPortrait, isGenerating, remainingGenerations, generatePortrait, error } =
    usePortraitStore();

  const [selectedBreed, setSelectedBreed] = useState('random');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('');
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);

  const isPremium = user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'lifetime';
  const availableBreeds = isPremium ? BREEDS : FREE_BREEDS;

  const remaining = remainingGenerations ?? getRemainingGenerations(
    user?.subscriptionTier || 'free',
    user?.dailyGenerationsUsed || 0
  );

  const canGenerate = isPremium || (remaining !== null && remaining > 0);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    const breed = selectedBreed === 'random' ? getRandomBreed(isPremium).id : selectedBreed;

    await generatePortrait({
      breed,
      color: isPremium ? selectedColor : undefined,
      background: isPremium ? selectedBackground : undefined,
    });
  };

  const getBreedName = (id: string) => {
    return BREEDS.find((b) => b.id === id)?.name || 'Random Breed';
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 py-6">
        {/* Generation Counter */}
        {!isPremium && (
          <View className="bg-card rounded-xl p-4 mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-white font-medium">Daily Portraits</Text>
              <Text className="text-muted-foreground text-sm">
                {remaining} of {PRICING.FREE.dailyLimit} remaining today
              </Text>
            </View>
            <Pressable className="bg-accent rounded-lg px-4 py-2">
              <Text className="text-white font-medium">Upgrade</Text>
            </Pressable>
          </View>
        )}

        {/* Breed Selector */}
        <View className="mb-4">
          <Text className="text-white font-medium mb-2">Breed</Text>
          <Pressable
            onPress={() => setShowBreedPicker(!showBreedPicker)}
            className="bg-card border border-border rounded-xl p-4 flex-row items-center justify-between"
          >
            <Text className="text-white">{getBreedName(selectedBreed)}</Text>
            <Ionicons name="chevron-down" size={20} color="#a1a1aa" />
          </Pressable>

          {showBreedPicker && (
            <View className="bg-card border border-border rounded-xl mt-2 max-h-64">
              <ScrollView nestedScrollEnabled>
                {availableBreeds.map((breed) => (
                  <Pressable
                    key={breed.id}
                    onPress={() => {
                      setSelectedBreed(breed.id);
                      setShowBreedPicker(false);
                    }}
                    className={`p-3 border-b border-border flex-row items-center justify-between ${
                      selectedBreed === breed.id ? 'bg-primary/20' : ''
                    }`}
                  >
                    <View className="flex-1">
                      <Text className="text-white">{breed.name}</Text>
                      <Text className="text-muted-foreground text-xs">{breed.description}</Text>
                    </View>
                    {breed.isPremium && !isPremium && (
                      <View className="bg-accent/20 rounded px-2 py-1 ml-2">
                        <Text className="text-accent text-xs">Premium</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Premium Options */}
        {isPremium && (
          <>
            {/* Color Selector */}
            <View className="mb-4">
              <Text className="text-white font-medium mb-2">Fur Color</Text>
              <Pressable
                onPress={() => setShowColorPicker(!showColorPicker)}
                className="bg-card border border-border rounded-xl p-4 flex-row items-center justify-between"
              >
                <Text className="text-white">
                  {PREMIUM_COLORS.find((c) => c.value === selectedColor)?.name || 'Natural Color'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#a1a1aa" />
              </Pressable>

              {showColorPicker && (
                <View className="bg-card border border-border rounded-xl mt-2">
                  <ScrollView nestedScrollEnabled className="max-h-48">
                    {PREMIUM_COLORS.map((color) => (
                      <Pressable
                        key={color.id}
                        onPress={() => {
                          setSelectedColor(color.value);
                          setShowColorPicker(false);
                        }}
                        className={`p-3 border-b border-border ${
                          selectedColor === color.value ? 'bg-primary/20' : ''
                        }`}
                      >
                        <Text className="text-white">{color.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Background Selector */}
            <View className="mb-6">
              <Text className="text-white font-medium mb-2">Background</Text>
              <Pressable
                onPress={() => setShowBackgroundPicker(!showBackgroundPicker)}
                className="bg-card border border-border rounded-xl p-4 flex-row items-center justify-between"
              >
                <Text className="text-white">
                  {PREMIUM_BACKGROUNDS.find((b) => b.value === selectedBackground)?.name ||
                    'Default Park'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#a1a1aa" />
              </Pressable>

              {showBackgroundPicker && (
                <View className="bg-card border border-border rounded-xl mt-2">
                  <ScrollView nestedScrollEnabled className="max-h-48">
                    {PREMIUM_BACKGROUNDS.map((bg) => (
                      <Pressable
                        key={bg.id}
                        onPress={() => {
                          setSelectedBackground(bg.value);
                          setShowBackgroundPicker(false);
                        }}
                        className={`p-3 border-b border-border ${
                          selectedBackground === bg.value ? 'bg-primary/20' : ''
                        }`}
                      >
                        <Text className="text-white">{bg.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </>
        )}

        {/* Portrait Display */}
        <View className="bg-card rounded-2xl overflow-hidden mb-6">
          {isGenerating ? (
            <View className="aspect-square items-center justify-center">
              <ActivityIndicator size="large" color="#6366f1" />
              <Text className="text-muted-foreground mt-4">Creating your masterpiece...</Text>
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
            </View>
          ) : (
            <View className="aspect-square items-center justify-center p-8">
              <Ionicons name="paw" size={80} color="#6366f1" />
              <Text className="text-white text-xl font-semibold mt-4 text-center">
                Ready to Create
              </Text>
              <Text className="text-muted-foreground text-center mt-2">
                Select your options and tap generate
              </Text>
            </View>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View className="bg-destructive/20 border border-destructive rounded-xl p-4 mb-4">
            <Text className="text-destructive">{error}</Text>
          </View>
        )}

        {/* Generate Button */}
        <Pressable
          onPress={handleGenerate}
          disabled={isGenerating || !canGenerate}
          className={`rounded-xl p-4 items-center ${
            isGenerating || !canGenerate ? 'bg-primary/50' : 'bg-primary'
          }`}
        >
          <View className="flex-row items-center">
            {isGenerating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="sparkles" size={20} color="white" />
            )}
            <Text className="text-white font-semibold text-lg ml-2">
              {isGenerating
                ? 'Generating...'
                : !canGenerate
                ? 'Daily Limit Reached'
                : 'Generate Portrait'}
            </Text>
          </View>
        </Pressable>

        {/* Action Buttons */}
        {currentPortrait && (
          <View className="flex-row mt-4 gap-3">
            <Pressable className="flex-1 bg-card border border-border rounded-xl p-3 items-center flex-row justify-center">
              <Ionicons name="download" size={20} color="#a1a1aa" />
              <Text className="text-white ml-2">Download</Text>
            </Pressable>
            <Pressable className="flex-1 bg-card border border-border rounded-xl p-3 items-center flex-row justify-center">
              <Ionicons name="share" size={20} color="#a1a1aa" />
              <Text className="text-white ml-2">Share</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
