import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Dimensions, Platform, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/auth-store';
import { usePortraitStore } from '../../store/portrait-store';
import { useThemeStore } from '../../store/theme-store';
import {
  BREEDS,
  FREE_BREEDS,
  PREMIUM_COLORS,
  PREMIUM_BACKGROUNDS,
  getRandomBreed,
  PRICING,
  getRemainingGenerations,
  getUsagePeriodLabel,
  Theme,
  SEASONS,
  HOLIDAYS,
  EVENTS,
  FREE_THEMES,
  ALL_THEMES,
  getFeaturedThemesForTier,
  isThemeInSeason,
} from '@pup-portrait/shared';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const maxWidth = isWeb ? 480 : screenWidth;

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentPortrait, isGenerating, remainingGenerations, generatePortrait, error } =
    usePortraitStore();
  const { colors } = useThemeStore();

  const [selectedBreed, setSelectedBreed] = useState('random');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [breedSearch, setBreedSearch] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const isPremium = user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'lifetime';
  // 2026-05-20: search across the full breed catalog regardless of tier so a
  // free user can still discover and request any breed (premium ones surface
  // an upgrade nudge via the badge). Free users keep their tier-rate limit.
  const availableBreeds = useMemo(() => {
    const q = breedSearch.trim().toLowerCase();
    if (!q) return BREEDS;
    return BREEDS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
    );
  }, [breedSearch]);
  const tier = user?.subscriptionTier || 'free';

  // Get usage info based on tier. Free tier is now a one-time offer (6 images)
  // tracked by freeImagesUsed/freeOfferUsed rather than a weekly counter.
  const usageCount = tier === 'free'
    ? (user?.freeImagesUsed || 0)
    : (user?.dailyGenerationsUsed || 0);

  const remaining = remainingGenerations ?? getRemainingGenerations(
    tier,
    usageCount,
    false,
    user?.packCredits ?? 0,
    user?.freeOfferUsed ?? false,
    user?.freeImagesUsed ?? 0
  );
  const usagePeriod = getUsagePeriodLabel(tier);
  const limit = tier === 'free' ? PRICING.FREE.freeTotalImages : PRICING.PREMIUM.dailyLimit;

  const canGenerate = isPremium || (remaining !== null && remaining > 0);

  // Get featured themes for user's tier
  const featuredThemes = getFeaturedThemesForTier(tier, 4);
  const availableThemes = isPremium ? ALL_THEMES : FREE_THEMES;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    const breed = selectedBreed === 'random' ? getRandomBreed(isPremium).id : selectedBreed;

    const result = await generatePortrait({
      breed,
      color: isPremium ? selectedColor : undefined,
      background: isPremium ? selectedBackground : undefined,
      themePrompt: selectedTheme?.prompt,
    });

    // Refresh user profile to update weekly/daily counts
    if (result.success) {
      await useAuthStore.getState().refreshUser();
    }
  };

  const getBreedName = (id: string) => {
    if (id === 'random') return 'Surprise Me!';
    return BREEDS.find((b) => b.id === id)?.name || 'Random Breed';
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.gradient}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { alignItems: 'center' }]}
      >
        <View style={[styles.container, { maxWidth }]}>
          {/* Generation Counter */}
          {!isPremium && (
            <View style={[styles.usageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.usageTitle, { color: colors.text }]}>
                  {tier === 'free' ? 'Free offer' : 'Daily Portraits'}
                </Text>
                <Text style={[styles.usageSubtitle, { color: colors.muted }]}>
                  {tier === 'free'
                    ? `1 watermarked portrait + 5 scenes · ${remaining} of ${limit} remaining`
                    : `${remaining} of ${limit} remaining ${usagePeriod}`}
                </Text>
              </View>
              <Pressable
                style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>
              </Pressable>
            </View>
          )}

          {/* Theme Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
              {/* No theme option */}
              <Pressable
                onPress={() => setSelectedTheme(null)}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: !selectedTheme ? colors.primary : colors.card,
                    borderColor: colors.border,
                  }
                ]}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={!selectedTheme ? colors.white : colors.muted}
                />
                <Text style={[
                  styles.themeChipText,
                  { color: !selectedTheme ? colors.white : colors.text }
                ]}>
                  Classic
                </Text>
              </Pressable>

              {/* Featured themes */}
              {featuredThemes.map((theme) => (
                <Pressable
                  key={theme.id}
                  onPress={() => setSelectedTheme(theme)}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: selectedTheme?.id === theme.id ? colors.primary : colors.card,
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <Ionicons
                    name={theme.icon as any}
                    size={16}
                    color={selectedTheme?.id === theme.id ? colors.white : colors.muted}
                  />
                  <Text style={[
                    styles.themeChipText,
                    { color: selectedTheme?.id === theme.id ? colors.white : colors.text }
                  ]}>
                    {theme.name}
                  </Text>
                  {theme.isPremium && !isPremium && (
                    <Ionicons name="lock-closed" size={12} color={colors.accent} />
                  )}
                </Pressable>
              ))}

              {/* More themes button */}
              <Pressable
                onPress={() => setShowThemePicker(true)}
                style={[styles.themeChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.muted} />
                <Text style={[styles.themeChipText, { color: colors.text }]}>More</Text>
              </Pressable>
            </ScrollView>
          </View>

          {/* Theme Picker Modal */}
          {showThemePicker && (
            <View style={[styles.pickerModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.pickerHeader}>
                <Text style={[styles.pickerTitle, { color: colors.text }]}>All Themes</Text>
                <Pressable onPress={() => setShowThemePicker(false)}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </Pressable>
              </View>
              <ScrollView style={styles.pickerList} nestedScrollEnabled>
                {/* Seasons */}
                <Text style={[styles.categoryTitle, { color: colors.muted }]}>Seasons</Text>
                {SEASONS.map((theme) => (
                  <Pressable
                    key={theme.id}
                    onPress={() => {
                      setSelectedTheme(theme);
                      setShowThemePicker(false);
                    }}
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: colors.border },
                      selectedTheme?.id === theme.id && { backgroundColor: colors.primaryLight + '20' }
                    ]}
                  >
                    <Ionicons name={theme.icon as any} size={20} color={colors.primary} />
                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{theme.name}</Text>
                    {isThemeInSeason(theme) && (
                      <View style={[styles.inSeasonBadge, { backgroundColor: colors.accentGreen + '20' }]}>
                        <Text style={[styles.inSeasonText, { color: colors.accentGreen }]}>In Season</Text>
                      </View>
                    )}
                  </Pressable>
                ))}

                {/* Holidays */}
                <Text style={[styles.categoryTitle, { color: colors.muted }]}>Holidays</Text>
                {HOLIDAYS.map((theme) => (
                  <Pressable
                    key={theme.id}
                    onPress={() => {
                      setSelectedTheme(theme);
                      setShowThemePicker(false);
                    }}
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: colors.border },
                      selectedTheme?.id === theme.id && { backgroundColor: colors.primaryLight + '20' }
                    ]}
                  >
                    <Ionicons name={theme.icon as any} size={20} color={colors.primary} />
                    <Text style={[styles.pickerItemText, { color: colors.text }]}>{theme.name}</Text>
                    {isThemeInSeason(theme) && (
                      <View style={[styles.inSeasonBadge, { backgroundColor: colors.accentGreen + '20' }]}>
                        <Text style={[styles.inSeasonText, { color: colors.accentGreen }]}>In Season</Text>
                      </View>
                    )}
                  </Pressable>
                ))}

                {/* Events (Premium) */}
                <Text style={[styles.categoryTitle, { color: colors.muted }]}>Events (Premium)</Text>
                {EVENTS.map((theme) => (
                  <Pressable
                    key={theme.id}
                    onPress={() => {
                      if (isPremium) {
                        setSelectedTheme(theme);
                        setShowThemePicker(false);
                      }
                    }}
                    style={[
                      styles.pickerItem,
                      { borderBottomColor: colors.border },
                      selectedTheme?.id === theme.id && { backgroundColor: colors.primaryLight + '20' },
                      !isPremium && { opacity: 0.6 }
                    ]}
                  >
                    <Ionicons name={theme.icon as any} size={20} color={isPremium ? colors.primary : colors.muted} />
                    <Text style={[styles.pickerItemText, { color: isPremium ? colors.text : colors.muted }]}>
                      {theme.name}
                    </Text>
                    {!isPremium && (
                      <Ionicons name="lock-closed" size={16} color={colors.accent} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Breed Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Breed</Text>
            <Pressable
              onPress={() => setShowBreedPicker(!showBreedPicker)}
              style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[styles.selectorText, { color: colors.text }]}>{getBreedName(selectedBreed)}</Text>
              <Ionicons name={showBreedPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
            </Pressable>

            {showBreedPicker && (
              <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {/* Type-to-search input */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    gap: 8,
                  }}
                >
                  <Ionicons name="search" size={16} color={colors.muted} />
                  <TextInput
                    value={breedSearch}
                    onChangeText={setBreedSearch}
                    placeholder="Type a breed — Bernese, Pug, Frenchie…"
                    placeholderTextColor={colors.muted}
                    autoFocus
                    style={{
                      flex: 1,
                      color: colors.text,
                      fontSize: 14,
                      paddingVertical: 4,
                      ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
                    }}
                  />
                  {breedSearch.length > 0 && (
                    <Pressable onPress={() => setBreedSearch('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={16} color={colors.muted} />
                    </Pressable>
                  )}
                </View>

                <ScrollView nestedScrollEnabled style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
                  {breedSearch.trim().length === 0 && (
                    <Pressable
                      onPress={() => {
                        setSelectedBreed('random');
                        setShowBreedPicker(false);
                        setBreedSearch('');
                      }}
                      style={[
                        styles.pickerItem,
                        { borderBottomColor: colors.border },
                        selectedBreed === 'random' && { backgroundColor: colors.primaryLight + '20' }
                      ]}
                    >
                      <View style={styles.breedInfo}>
                        <Text style={[styles.pickerItemText, { color: colors.text }]}>Surprise Me!</Text>
                        <Text style={[styles.breedDesc, { color: colors.muted }]}>Let the AI pick a breed at random</Text>
                      </View>
                    </Pressable>
                  )}
                  {availableBreeds
                    .filter((b) => b.id !== 'random')
                    .map((breed) => (
                      <Pressable
                        key={breed.id}
                        onPress={() => {
                          setSelectedBreed(breed.id);
                          setShowBreedPicker(false);
                          setBreedSearch('');
                        }}
                        style={[
                          styles.pickerItem,
                          { borderBottomColor: colors.border },
                          selectedBreed === breed.id && { backgroundColor: colors.primaryLight + '20' }
                        ]}
                      >
                        <View style={styles.breedInfo}>
                          <Text style={[styles.pickerItemText, { color: colors.text }]}>{breed.name}</Text>
                          <Text style={[styles.breedDesc, { color: colors.muted }]}>{breed.description}</Text>
                        </View>
                        {breed.isPremium && !isPremium && (
                          <View style={[styles.premiumBadge, { backgroundColor: colors.primary + '22' }]}>
                            <Ionicons name="lock-closed" size={10} color={colors.primary} />
                            <Text style={[styles.premiumBadgeText, { color: colors.primary, marginLeft: 4 }]}>Premium</Text>
                          </View>
                        )}
                      </Pressable>
                    ))}
                  {availableBreeds.length === 0 && (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: colors.muted, fontSize: 13 }}>
                        No breeds match “{breedSearch}”. Try a shorter spelling.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Premium Options */}
          {isPremium && (
            <>
              {/* Color Selector */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Fur Color</Text>
                <Pressable
                  onPress={() => setShowColorPicker(!showColorPicker)}
                  style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[styles.selectorText, { color: colors.text }]}>
                    {PREMIUM_COLORS.find((c) => c.value === selectedColor)?.name || 'Natural Color'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.muted} />
                </Pressable>

                {showColorPicker && (
                  <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 192 }}>
                      {PREMIUM_COLORS.map((color) => (
                        <Pressable
                          key={color.id}
                          onPress={() => {
                            setSelectedColor(color.value);
                            setShowColorPicker(false);
                          }}
                          style={[
                            styles.pickerItem,
                            { borderBottomColor: colors.border },
                            selectedColor === color.value && { backgroundColor: colors.primaryLight + '20' }
                          ]}
                        >
                          <Text style={[styles.pickerItemText, { color: colors.text }]}>{color.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Background Selector */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Background</Text>
                <Pressable
                  onPress={() => setShowBackgroundPicker(!showBackgroundPicker)}
                  style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Text style={[styles.selectorText, { color: colors.text }]}>
                    {PREMIUM_BACKGROUNDS.find((b) => b.value === selectedBackground)?.name || 'Default Park'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.muted} />
                </Pressable>

                {showBackgroundPicker && (
                  <View style={[styles.pickerDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 192 }}>
                      {PREMIUM_BACKGROUNDS.map((bg) => (
                        <Pressable
                          key={bg.id}
                          onPress={() => {
                            setSelectedBackground(bg.value);
                            setShowBackgroundPicker(false);
                          }}
                          style={[
                            styles.pickerItem,
                            { borderBottomColor: colors.border },
                            selectedBackground === bg.value && { backgroundColor: colors.primaryLight + '20' }
                          ]}
                        >
                          <Text style={[styles.pickerItemText, { color: colors.text }]}>{bg.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </>
          )}

          {/* Portrait Display */}
          <View style={[styles.portraitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {isGenerating ? (
              <View style={styles.portraitPlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.generatingText, { color: colors.muted }]}>Creating your masterpiece...</Text>
              </View>
            ) : currentPortrait ? (
              <View>
                <Image
                  source={{ uri: currentPortrait.imageUrl }}
                  style={styles.portraitImage}
                  contentFit="cover"
                />
                {/* Watermark for free tier */}
                {!isPremium && (
                  <View style={styles.watermarkContainer}>
                    <View style={styles.watermarkBadge}>
                      <Ionicons name="paw" size={14} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.watermarkText}>pupportrait.com</Text>
                    </View>
                  </View>
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.portraitOverlay}
                >
                  <Text style={styles.portraitName}>Meet {currentPortrait.name || 'Your Pup'}</Text>
                  <Text style={styles.portraitBreed}>{currentPortrait.breed}</Text>
                </LinearGradient>
              </View>
            ) : (
              <View style={styles.portraitPlaceholder}>
                <Ionicons name="paw" size={80} color={colors.primary} />
                <Text style={[styles.placeholderTitle, { color: colors.text }]}>Ready to Create</Text>
                <Text style={[styles.placeholderSubtitle, { color: colors.muted }]}>
                  Select your options and tap generate
                </Text>
              </View>
            )}
          </View>

          {/* Error Display */}
          {error && (
            <View style={[styles.errorCard, { backgroundColor: colors.destructive + '20', borderColor: colors.destructive }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          {/* Generate Button */}
          <Pressable
            onPress={handleGenerate}
            disabled={isGenerating || !canGenerate}
            style={[
              styles.generateButton,
              { backgroundColor: isGenerating || !canGenerate ? colors.primary + '50' : colors.primary }
            ]}
          >
            <View style={styles.generateButtonContent}>
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="sparkles" size={20} color={colors.white} />
              )}
              <Text style={styles.generateButtonText}>
                {isGenerating
                  ? 'Generating...'
                  : !canGenerate
                  ? 'Limit Reached'
                  : 'Generate Portrait'}
              </Text>
            </View>
          </Pressable>

          {/* Action Buttons */}
          {currentPortrait && (
            <View style={styles.actionButtons}>
              <Pressable style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="download" size={20} color={colors.muted} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Download</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="share" size={20} color={colors.muted} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Share</Text>
              </Pressable>
            </View>
          )}

          {/* Upgrade CTA for free users */}
          {!isPremium && (
            <View style={[styles.upgradeCta, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
              <View style={styles.upgradeCtaContent}>
                <Ionicons name="star" size={24} color={colors.primary} />
                <View style={styles.upgradeCtaText}>
                  <Text style={[styles.upgradeCtaTitle, { color: colors.text }]}>Unlock Premium</Text>
                  <Text style={[styles.upgradeCtaSubtitle, { color: colors.muted }]}>
                    HD portraits, all breeds, custom backgrounds & more
                  </Text>
                </View>
              </View>
              <Pressable
                style={[styles.upgradeCtaButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Text style={styles.upgradeCtaButtonText}>View Plans</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  usageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  usageSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  themeScroll: {
    marginHorizontal: -4,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    gap: 6,
  },
  themeChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerModal: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerList: {
    maxHeight: 300,
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 1,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  selectorText: {
    fontSize: 16,
  },
  pickerDropdown: {
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  pickerItemText: {
    fontSize: 16,
    flex: 1,
  },
  breedInfo: {
    flex: 1,
  },
  breedDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inSeasonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inSeasonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  portraitCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  portraitPlaceholder: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  portraitImage: {
    width: '100%',
    aspectRatio: 1,
  },
  watermarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  watermarkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  portraitOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  portraitName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  portraitBreed: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  generatingText: {
    marginTop: 16,
    fontSize: 16,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  generateButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeCta: {
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
  },
  upgradeCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  upgradeCtaText: {
    flex: 1,
  },
  upgradeCtaTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeCtaSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  upgradeCtaButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeCtaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
