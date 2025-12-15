import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Dimensions, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/auth-store';
import { usePortraitStore } from '../store/portrait-store';
import { hasGuestUsedFreeTrial } from '../lib/guest-tracker';
import {
  BREEDS,
  FREE_BREEDS,
  getRandomBreed,
  ASPECT_RATIOS,
  AspectRatioId,
  SOCIAL_PLATFORMS,
  SHARE_BRANDING,
  APP_NAME,
  APP_TAGLINE,
  Theme,
  SEASONS,
  HOLIDAYS,
  EVENTS,
  getFeaturedThemes,
  isThemeInSeason,
} from '@pup-portrait/shared';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const maxWidth = isWeb ? 480 : screenWidth;

// Theme colors
const colors = {
  background: '#0f0f1a',
  backgroundGradientStart: '#1a1a2e',
  backgroundGradientEnd: '#0f0f1a',
  card: '#1a1a2e',
  cardHover: '#252540',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  accent: '#f59e0b',
  accentGreen: '#10b981',
  border: '#2a2a3e',
  borderLight: '#3a3a4e',
  white: '#ffffff',
  muted: '#a1a1aa',
  mutedLight: '#d4d4d8',
  destructive: '#ef4444',
};

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { currentPortrait, isGenerating, generatePortrait, error } = usePortraitStore();

  const [selectedBreed, setSelectedBreed] = useState('random');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioId>('square');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Get featured themes (in-season ones first)
  const featuredThemes = getFeaturedThemes(4);

  useEffect(() => {
    hasGuestUsedFreeTrial().then(setHasUsedTrial);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, authLoading]);

  const handleGenerate = async () => {
    if (hasUsedTrial) {
      router.push('/(auth)/signup');
      return;
    }

    const breed = selectedBreed === 'random' ? getRandomBreed().id : selectedBreed;
    await generatePortrait({
      breed,
      themePrompt: selectedTheme?.prompt,
    }, true);
    setHasUsedTrial(true);
  };

  const handleShare = (platformId: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    if (!platform || !currentPortrait) return;

    const shareText = SHARE_BRANDING.shareTextWithLink(currentPortrait.breed);
    const shareUrl = platform.shareUrl(currentPortrait.imageUrl, shareText);

    if (shareUrl) {
      Linking.openURL(shareUrl);
    }
  };

  const getBreedName = (id: string) => {
    if (id === 'random') return 'Surprise Me!';
    return BREEDS.find((b) => b.id === id)?.name || 'Random Breed';
  };

  const getAspectRatioStyle = (ratio: typeof ASPECT_RATIOS[0]) => {
    const baseSize = Math.min(maxWidth - 48, 360);
    if (ratio.width > ratio.height) {
      return { width: baseSize, height: baseSize * (ratio.height / ratio.width) };
    } else {
      return { height: baseSize, width: baseSize * (ratio.width / ratio.height) };
    }
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const selectedRatio = ASPECT_RATIOS.find(r => r.id === selectedAspectRatio) || ASPECT_RATIOS[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.wrapper}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Ionicons name="paw" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.tagline}>{APP_TAGLINE}</Text>
          <Text style={styles.subtitle}>
            Generate stunning AI portraits of your dream dog in seconds
          </Text>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Breed Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Choose Your Breed</Text>
            <Pressable
              onPress={() => setShowBreedPicker(!showBreedPicker)}
              style={styles.selector}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="paw" size={20} color={colors.primary} />
                <Text style={styles.selectorText}>{getBreedName(selectedBreed)}</Text>
              </View>
              <Ionicons
                name={showBreedPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.muted}
              />
            </Pressable>

            {showBreedPicker && (
              <View style={styles.dropdown}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  <Pressable
                    onPress={() => {
                      setSelectedBreed('random');
                      setShowBreedPicker(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      selectedBreed === 'random' && styles.dropdownItemSelected,
                    ]}
                  >
                    <Ionicons name="shuffle" size={18} color={colors.accent} />
                    <View style={styles.dropdownItemContent}>
                      <Text style={styles.dropdownItemText}>Surprise Me!</Text>
                      <Text style={styles.dropdownItemDesc}>Random breed selection</Text>
                    </View>
                  </Pressable>
                  {FREE_BREEDS.map((breed) => (
                    <Pressable
                      key={breed.id}
                      onPress={() => {
                        setSelectedBreed(breed.id);
                        setShowBreedPicker(false);
                      }}
                      style={[
                        styles.dropdownItem,
                        selectedBreed === breed.id && styles.dropdownItemSelected,
                      ]}
                    >
                      <Ionicons name="paw" size={18} color={colors.muted} />
                      <View style={styles.dropdownItemContent}>
                        <Text style={styles.dropdownItemText}>{breed.name}</Text>
                        <Text style={styles.dropdownItemDesc}>{breed.description}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Theme Selector */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Add a Theme</Text>
              <View style={styles.freeBadge}>
                <Ionicons name="gift" size={12} color={colors.accentGreen} />
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            </View>

            {/* Featured Themes (Quick Select) */}
            <View style={styles.featuredThemes}>
              {featuredThemes.map((theme) => {
                const isSelected = selectedTheme?.id === theme.id;
                const inSeason = isThemeInSeason(theme);
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => setSelectedTheme(isSelected ? null : theme)}
                    style={[
                      styles.featuredThemeItem,
                      isSelected && styles.featuredThemeItemSelected,
                    ]}
                  >
                    <View style={styles.themeIconContainer}>
                      <Ionicons
                        name={theme.icon as any}
                        size={20}
                        color={isSelected ? colors.primary : colors.white}
                      />
                      {inSeason && (
                        <View style={styles.seasonBadge}>
                          <Ionicons name="sparkles" size={8} color={colors.accent} />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.featuredThemeName,
                      isSelected && styles.featuredThemeNameSelected,
                    ]}>
                      {theme.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Show More Button */}
            <Pressable
              onPress={() => setShowThemePicker(!showThemePicker)}
              style={styles.showMoreThemes}
            >
              <Text style={styles.showMoreText}>
                {showThemePicker ? 'Show Less' : 'See All Themes'}
              </Text>
              <Ionicons
                name={showThemePicker ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.primary}
              />
            </Pressable>

            {/* All Themes Dropdown */}
            {showThemePicker && (
              <View style={styles.themesDropdown}>
                <ScrollView style={styles.themesScroll} nestedScrollEnabled>
                  {/* None Option */}
                  <Pressable
                    onPress={() => {
                      setSelectedTheme(null);
                      setShowThemePicker(false);
                    }}
                    style={[
                      styles.themeDropdownItem,
                      !selectedTheme && styles.themeDropdownItemSelected,
                    ]}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={colors.muted} />
                    <Text style={styles.themeDropdownText}>No Theme (Classic)</Text>
                  </Pressable>

                  {/* Seasons */}
                  <Text style={styles.themeCategoryLabel}>Seasons</Text>
                  {SEASONS.map((theme) => (
                    <ThemeDropdownItem
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme?.id === theme.id}
                      onSelect={() => {
                        setSelectedTheme(theme);
                        setShowThemePicker(false);
                      }}
                    />
                  ))}

                  {/* Holidays */}
                  <Text style={styles.themeCategoryLabel}>Holidays</Text>
                  {HOLIDAYS.map((theme) => (
                    <ThemeDropdownItem
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme?.id === theme.id}
                      onSelect={() => {
                        setSelectedTheme(theme);
                        setShowThemePicker(false);
                      }}
                    />
                  ))}

                  {/* Events */}
                  <Text style={styles.themeCategoryLabel}>Special Events</Text>
                  {EVENTS.map((theme) => (
                    <ThemeDropdownItem
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme?.id === theme.id}
                      onSelect={() => {
                        setSelectedTheme(theme);
                        setShowThemePicker(false);
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Selected Theme Display */}
            {selectedTheme && (
              <View style={styles.selectedThemePreview}>
                <Ionicons name={selectedTheme.icon as any} size={16} color={colors.primary} />
                <Text style={styles.selectedThemeText}>
                  Theme: <Text style={styles.selectedThemeName}>{selectedTheme.name}</Text>
                </Text>
                <Pressable onPress={() => setSelectedTheme(null)}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Aspect Ratio Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Choose Size</Text>
            <View style={styles.aspectRatioGrid}>
              {ASPECT_RATIOS.map((ratio) => {
                const isSelected = selectedAspectRatio === ratio.id;
                const isLocked = ratio.isPremium;
                return (
                  <Pressable
                    key={ratio.id}
                    onPress={() => {
                      if (isLocked) {
                        router.push('/(auth)/signup');
                      } else {
                        setSelectedAspectRatio(ratio.id);
                      }
                    }}
                    style={[
                      styles.aspectRatioItem,
                      isSelected && styles.aspectRatioItemSelected,
                      isLocked && styles.aspectRatioItemLocked,
                    ]}
                  >
                    <View style={styles.aspectRatioIconContainer}>
                      <Ionicons
                        name={ratio.icon as any}
                        size={24}
                        color={isSelected ? colors.primary : isLocked ? colors.muted : colors.white}
                      />
                      {isLocked && (
                        <View style={styles.lockBadge}>
                          <Ionicons name="lock-closed" size={10} color={colors.white} />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.aspectRatioName,
                      isSelected && styles.aspectRatioNameSelected,
                      isLocked && styles.aspectRatioNameLocked,
                    ]}>
                      {ratio.name}
                    </Text>
                    <Text style={styles.aspectRatioDesc}>{ratio.ratio}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Portrait Display */}
          <View style={styles.portraitContainer}>
            <View style={[styles.portraitCard, getAspectRatioStyle(selectedRatio)]}>
              {isGenerating ? (
                <View style={styles.portraitPlaceholder}>
                  <View style={styles.generatingAnimation}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                  <Text style={styles.generatingText}>Creating your portrait...</Text>
                  <Text style={styles.generatingSubtext}>This takes about 10 seconds</Text>
                </View>
              ) : currentPortrait ? (
                <View style={styles.portraitImageContainer}>
                  <Image
                    source={{ uri: currentPortrait.imageUrl }}
                    style={styles.portraitImage}
                    contentFit="cover"
                  />
                  {/* Watermark */}
                  <View style={styles.watermark}>
                    <Ionicons name="paw" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.watermarkText}>{SHARE_BRANDING.watermarkText}</Text>
                  </View>
                  {/* Breed Badge */}
                  <View style={styles.breedBadge}>
                    <Text style={styles.breedBadgeText}>{currentPortrait.breed}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.portraitPlaceholder}>
                  <View style={styles.placeholderIcon}>
                    <Ionicons name="camera" size={48} color={colors.primary} />
                  </View>
                  <Text style={styles.placeholderTitle}>Your Portrait Here</Text>
                  <Text style={styles.placeholderText}>
                    Select a breed and tap Generate
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Generate Button */}
          <Pressable
            onPress={handleGenerate}
            disabled={isGenerating}
            style={({ pressed }) => [
              styles.generateButton,
              isGenerating && styles.generateButtonDisabled,
              pressed && styles.generateButtonPressed,
            ]}
          >
            <LinearGradient
              colors={isGenerating ? ['#4b5563', '#374151'] : [colors.primary, colors.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateButtonGradient}
            >
              <Ionicons
                name={hasUsedTrial ? "person-add" : "sparkles"}
                size={24}
                color="white"
              />
              <Text style={styles.generateButtonText}>
                {hasUsedTrial ? 'Sign Up to Continue' : 'Generate Portrait'}
              </Text>
            </LinearGradient>
          </Pressable>

          {!hasUsedTrial && (
            <View style={styles.freeTrialBadge}>
              <Ionicons name="gift" size={16} color={colors.accentGreen} />
              <Text style={styles.freeTrialText}>First portrait is FREE!</Text>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Social Share Section (after portrait generated) */}
        {currentPortrait && (
          <View style={styles.shareCard}>
            <Text style={styles.shareTitle}>Share Your Creation</Text>
            <Text style={styles.shareSubtitle}>Show off your adorable pup!</Text>

            <View style={styles.socialButtons}>
              {SOCIAL_PLATFORMS.filter(p => p.shareUrl('', '') !== '').map((platform) => (
                <Pressable
                  key={platform.id}
                  onPress={() => handleShare(platform.id)}
                  style={[styles.socialButton, { backgroundColor: platform.color }]}
                >
                  <Ionicons name={platform.icon as any} size={24} color="white" />
                </Pressable>
              ))}
            </View>

            <View style={styles.brandingNote}>
              <Ionicons name="information-circle" size={16} color={colors.muted} />
              <Text style={styles.brandingNoteText}>
                Free shares include "Created with Pup Portrait"
              </Text>
            </View>

            {/* Signup prompt after share */}
            <View style={styles.upgradePrompt}>
              <Text style={styles.upgradeTitle}>Want More?</Text>
              <Text style={styles.upgradeText}>
                Sign up for 3 free portraits daily, HD downloads, and more sizes!
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/signup')}
                style={styles.upgradeButton}
              >
                <Text style={styles.upgradeButtonText}>Create Free Account</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Why Pup Portrait?</Text>

          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="flash"
              title="Instant Results"
              description="AI generates your portrait in seconds"
            />
            <FeatureCard
              icon="color-palette"
              title="Custom Styles"
              description="Choose from multiple art styles"
            />
            <FeatureCard
              icon="share-social"
              title="Easy Sharing"
              description="Share directly to social media"
            />
            <FeatureCard
              icon="heart"
              title="25+ Breeds"
              description="From Golden Retrievers to Huskies"
            />
          </View>
        </View>

        {/* Pricing Teaser */}
        <View style={styles.pricingTeaser}>
          <Text style={styles.pricingTitle}>Go Premium</Text>
          <Text style={styles.pricingSubtitle}>Unlock the full experience</Text>

          <View style={styles.pricingFeatures}>
            <PricingFeature text="Unlimited portraits" />
            <PricingFeature text="All aspect ratios" />
            <PricingFeature text="HD 1024px downloads" />
            <PricingFeature text="No watermarks" />
            <PricingFeature text="Premium breeds" />
            <PricingFeature text="Custom colors & backgrounds" />
          </View>

          <View style={styles.pricingOptions}>
            <Text style={styles.pricingFrom}>Starting at</Text>
            <Text style={styles.pricingAmount}>$7.99<Text style={styles.pricingPeriod}>/mo</Text></Text>
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            style={styles.pricingButton}
          >
            <Text style={styles.pricingButtonText}>View Plans</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 Pup Portrait. All rights reserved.</Text>
          <View style={styles.footerLinks}>
            <Pressable>
              <Text style={styles.footerLink}>Privacy</Text>
            </Pressable>
            <Text style={styles.footerDivider}>•</Text>
            <Pressable>
              <Text style={styles.footerLink}>Terms</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{description}</Text>
    </View>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <View style={styles.pricingFeature}>
      <Ionicons name="checkmark-circle" size={18} color={colors.accentGreen} />
      <Text style={styles.pricingFeatureText}>{text}</Text>
    </View>
  );
}

function ThemeDropdownItem({ theme, isSelected, onSelect }: { theme: Theme; isSelected: boolean; onSelect: () => void }) {
  const inSeason = isThemeInSeason(theme);
  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.themeDropdownItem,
        isSelected && styles.themeDropdownItemSelected,
      ]}
    >
      <View style={styles.themeDropdownIconWrap}>
        <Ionicons name={theme.icon as any} size={18} color={isSelected ? colors.primary : colors.muted} />
        {inSeason && (
          <View style={styles.miniSeasonBadge}>
            <Ionicons name="sparkles" size={6} color={colors.accent} />
          </View>
        )}
      </View>
      <View style={styles.themeDropdownContent}>
        <Text style={[styles.themeDropdownText, isSelected && styles.themeDropdownTextSelected]}>
          {theme.name}
        </Text>
        {inSeason && <Text style={styles.themeInSeasonLabel}>In Season!</Text>}
      </View>
      {isSelected && <Ionicons name="checkmark" size={18} color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  wrapper: {
    maxWidth: maxWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 24 : 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Main Card
  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedLight,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Selector
  selector: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },

  // Dropdown
  dropdown: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 240,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownItemDesc: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },

  // Aspect Ratio
  aspectRatioGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aspectRatioItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  aspectRatioItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  aspectRatioItemLocked: {
    opacity: 0.6,
  },
  aspectRatioIconContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    padding: 2,
  },
  aspectRatioName: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  aspectRatioNameSelected: {
    color: colors.primary,
  },
  aspectRatioNameLocked: {
    color: colors.muted,
  },
  aspectRatioDesc: {
    color: colors.muted,
    fontSize: 10,
  },

  // Portrait
  portraitContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  portraitCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  portraitPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  placeholderIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
  },
  generatingAnimation: {
    marginBottom: 16,
  },
  generatingText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  generatingSubtext: {
    color: colors.muted,
    fontSize: 12,
  },
  portraitImageContainer: {
    flex: 1,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  watermark: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '500',
  },
  breedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  breedBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },

  // Generate Button
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },

  // Free Trial Badge
  freeTrialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  freeTrialText: {
    color: colors.accentGreen,
    fontSize: 14,
    fontWeight: '600',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.destructive,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 12,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 14,
    flex: 1,
  },

  // Share Card
  shareCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  shareTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  shareSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  brandingNoteText: {
    color: colors.muted,
    fontSize: 12,
  },
  upgradePrompt: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  upgradeTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  upgradeText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Features
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },

  // Pricing
  pricingTeaser: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pricingTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  pricingSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 20,
  },
  pricingFeatures: {
    width: '100%',
    marginBottom: 20,
  },
  pricingFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  pricingFeatureText: {
    color: colors.mutedLight,
    fontSize: 14,
  },
  pricingOptions: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingFrom: {
    color: colors.muted,
    fontSize: 12,
  },
  pricingAmount: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '800',
  },
  pricingPeriod: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.muted,
  },
  pricingButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  pricingButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLink: {
    color: colors.muted,
    fontSize: 12,
  },
  footerDivider: {
    color: colors.muted,
    fontSize: 12,
  },

  // Theme Selector Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  freeBadgeText: {
    color: colors.accentGreen,
    fontSize: 11,
    fontWeight: '700',
  },
  featuredThemes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  featuredThemeItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 3,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  featuredThemeItemSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  themeIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  seasonBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 6,
    padding: 2,
  },
  featuredThemeName: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  featuredThemeNameSelected: {
    color: colors.primary,
  },
  showMoreThemes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  showMoreText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  themesDropdown: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 300,
    overflow: 'hidden',
  },
  themesScroll: {
    maxHeight: 300,
  },
  themeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  themeDropdownItemSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  themeDropdownIconWrap: {
    position: 'relative',
  },
  miniSeasonBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 4,
    padding: 1,
  },
  themeDropdownContent: {
    flex: 1,
  },
  themeDropdownText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  themeDropdownTextSelected: {
    color: colors.primary,
  },
  themeInSeasonLabel: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  themeCategoryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: colors.background,
  },
  selectedThemePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 8,
  },
  selectedThemeText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
  },
  selectedThemeName: {
    color: colors.primary,
    fontWeight: '600',
  },
});
