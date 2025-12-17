import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Dimensions, Linking, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/auth-store';
import { usePortraitStore } from '../store/portrait-store';
import { useThemeStore } from '../store/theme-store';
import { hasGuestUsedFreeTrial } from '../lib/guest-tracker';
import {
  BREEDS,
  FREE_BREEDS,
  getBreedsForDropdown,
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
  FREE_THEMES,
  getFeaturedThemes,
  getFeaturedThemesForTier,
  isThemeInSeason,
} from '@pup-portrait/shared';

const { width: screenWidth } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const maxWidth = isWeb ? 480 : screenWidth;

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { currentPortrait, isGenerating, generatePortrait, error } = usePortraitStore();
  const { mode: themeMode, colors, toggleTheme } = useThemeStore();

  const [selectedBreed, setSelectedBreed] = useState('random');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatioId>('square');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Get featured themes (in-season ones first) - guests only see free themes
  const featuredThemes = getFeaturedThemesForTier('free', 4);

  // Theme mode indicator
  const isDark = themeMode === 'dark';

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
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const selectedRatio = ASPECT_RATIOS.find(r => r.id === selectedAspectRatio) || ASPECT_RATIOS[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.wrapper}>
        {/* Theme Toggle */}
        <Pressable
          onPress={toggleTheme}
          style={[styles.themeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={20}
            color={colors.primary}
          />
        </Pressable>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.logoContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Ionicons name="paw" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{APP_NAME}</Text>
          <Text style={[styles.tagline, { color: colors.primary }]}>{APP_TAGLINE}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Generate stunning AI portraits of your dream dog in seconds
          </Text>
        </View>

        {/* Main Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Breed Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedLight }]}>Choose Your Breed</Text>
            <Pressable
              onPress={() => setShowBreedPicker(!showBreedPicker)}
              style={[styles.selector, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="paw" size={20} color={colors.primary} />
                <Text style={[styles.selectorText, { color: colors.text }]}>{getBreedName(selectedBreed)}</Text>
              </View>
              <Ionicons
                name={showBreedPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.muted}
              />
            </Pressable>

            {showBreedPicker && (
              <View style={[styles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  <Pressable
                    onPress={() => {
                      setSelectedBreed('random');
                      setShowBreedPicker(false);
                    }}
                    style={[
                      styles.dropdownItem,
                      { borderBottomColor: colors.border },
                      selectedBreed === 'random' && { backgroundColor: `${colors.primary}20` },
                    ]}
                  >
                    <Ionicons name="shuffle" size={18} color={colors.accent} />
                    <View style={styles.dropdownItemContent}>
                      <Text style={[styles.dropdownItemText, { color: colors.text }]}>Surprise Me!</Text>
                      <Text style={[styles.dropdownItemDesc, { color: colors.muted }]}>Random breed selection</Text>
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
                        { borderBottomColor: colors.border },
                        selectedBreed === breed.id && { backgroundColor: `${colors.primary}20` },
                      ]}
                    >
                      <Ionicons name="paw" size={18} color={colors.muted} />
                      <View style={styles.dropdownItemContent}>
                        <Text style={[styles.dropdownItemText, { color: colors.text }]}>{breed.name}</Text>
                        <Text style={[styles.dropdownItemDesc, { color: colors.muted }]}>{breed.description}</Text>
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
              <Text style={[styles.sectionLabel, { color: colors.mutedLight }]}>Add a Theme</Text>
              <View style={[styles.freeBadge, { backgroundColor: `${colors.accentGreen}20` }]}>
                <Ionicons name="gift" size={12} color={colors.accentGreen} />
                <Text style={[styles.freeBadgeText, { color: colors.accentGreen }]}>FREE</Text>
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
                      { backgroundColor: colors.background },
                      isSelected && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <View style={styles.themeIconContainer}>
                      <Ionicons
                        name={theme.icon as any}
                        size={20}
                        color={isSelected ? colors.primary : colors.text}
                      />
                      {inSeason && (
                        <View style={[styles.seasonBadge, { backgroundColor: `${colors.accent}30` }]}>
                          <Ionicons name="sparkles" size={8} color={colors.accent} />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.featuredThemeName,
                      { color: colors.text },
                      isSelected && { color: colors.primary },
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
              <Text style={[styles.showMoreText, { color: colors.primary }]}>
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
              <View style={[styles.themesDropdown, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ScrollView style={styles.themesScroll} nestedScrollEnabled>
                  {/* None Option */}
                  <Pressable
                    onPress={() => {
                      setSelectedTheme(null);
                      setShowThemePicker(false);
                    }}
                    style={[
                      styles.themeDropdownItem,
                      { borderBottomColor: colors.border },
                      !selectedTheme && { backgroundColor: `${colors.primary}20` },
                    ]}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={colors.muted} />
                    <Text style={[styles.themeDropdownText, { color: colors.text }]}>No Theme (Classic)</Text>
                  </Pressable>

                  {/* Seasons */}
                  <Text style={[styles.themeCategoryLabel, { color: colors.muted, backgroundColor: colors.background }]}>Seasons</Text>
                  {SEASONS.map((theme) => (
                    <ThemeDropdownItem
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme?.id === theme.id}
                      colors={colors}
                      onSelect={() => {
                        setSelectedTheme(theme);
                        setShowThemePicker(false);
                      }}
                    />
                  ))}

                  {/* Holidays */}
                  <Text style={[styles.themeCategoryLabel, { color: colors.muted, backgroundColor: colors.background }]}>Holidays</Text>
                  {HOLIDAYS.map((theme) => (
                    <ThemeDropdownItem
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme?.id === theme.id}
                      colors={colors}
                      onSelect={() => {
                        setSelectedTheme(theme);
                        setShowThemePicker(false);
                      }}
                    />
                  ))}

                  {/* Events (Premium) */}
                  <View style={styles.themeCategoryHeader}>
                    <Text style={[styles.themeCategoryLabel, { color: colors.muted, backgroundColor: colors.background }]}>Special Events</Text>
                    <View style={[styles.proBadgeSmall, { backgroundColor: `${colors.accent}20` }]}>
                      <Ionicons name="star" size={10} color={colors.accent} />
                      <Text style={[styles.proBadgeSmallText, { color: colors.accent }]}>PRO</Text>
                    </View>
                  </View>
                  {EVENTS.map((theme) => (
                    <ThemeDropdownItem
                      key={theme.id}
                      theme={theme}
                      isSelected={selectedTheme?.id === theme.id}
                      colors={colors}
                      isLocked={true}
                      onSelect={() => {
                        // Premium themes require signup - redirect to signup
                        router.push('/(auth)/signup');
                        setShowThemePicker(false);
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Selected Theme Display */}
            {selectedTheme && (
              <View style={[styles.selectedThemePreview, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}>
                <Ionicons name={selectedTheme.icon as any} size={16} color={colors.primary} />
                <Text style={[styles.selectedThemeText, { color: colors.muted }]}>
                  Theme: <Text style={[styles.selectedThemeName, { color: colors.primary }]}>{selectedTheme.name}</Text>
                </Text>
                <Pressable onPress={() => setSelectedTheme(null)}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Aspect Ratio Selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.mutedLight }]}>Choose Size</Text>
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
                      { backgroundColor: colors.background },
                      isSelected && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                      isLocked && styles.aspectRatioItemLocked,
                    ]}
                  >
                    <View style={styles.aspectRatioIconContainer}>
                      <Ionicons
                        name={ratio.icon as any}
                        size={24}
                        color={isSelected ? colors.primary : isLocked ? colors.muted : colors.text}
                      />
                      {isLocked && (
                        <View style={[styles.lockBadge, { backgroundColor: colors.accent }]}>
                          <Ionicons name="lock-closed" size={10} color={colors.white} />
                        </View>
                      )}
                    </View>
                    <Text style={[
                      styles.aspectRatioName,
                      { color: colors.text },
                      isSelected && { color: colors.primary },
                      isLocked && { color: colors.muted },
                    ]}>
                      {ratio.name}
                    </Text>
                    <Text style={[styles.aspectRatioDesc, { color: colors.muted }]}>{ratio.ratio}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Portrait Display */}
          <View style={styles.portraitContainer}>
            <View style={[styles.portraitCard, { backgroundColor: colors.background, borderColor: colors.border }, getAspectRatioStyle(selectedRatio)]}>
              {isGenerating ? (
                <View style={styles.portraitPlaceholder}>
                  <View style={styles.generatingAnimation}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                  <Text style={[styles.generatingText, { color: colors.text }]}>Creating your portrait...</Text>
                  <Text style={[styles.generatingSubtext, { color: colors.muted }]}>This takes about 10 seconds</Text>
                </View>
              ) : currentPortrait ? (
                <View style={styles.portraitImageContainer}>
                  <Image
                    source={{ uri: currentPortrait.imageUrl }}
                    style={styles.portraitImage}
                    contentFit="cover"
                  />
                  {/* Watermark with branding (for free/guest users) */}
                  <View style={styles.watermark}>
                    <Ionicons name="paw" size={12} color="rgba(255,255,255,0.9)" />
                    <View style={styles.watermarkTextContainer}>
                      <Text style={styles.watermarkText}>{SHARE_BRANDING.watermarkText}</Text>
                      <Text style={styles.watermarkUrl}>{SHARE_BRANDING.watermarkUrl}</Text>
                    </View>
                  </View>
                  {/* Breed Badge */}
                  <View style={[styles.breedBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.breedBadgeText, { color: colors.white }]}>{currentPortrait.breed}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.portraitPlaceholder}>
                  <View style={[styles.placeholderIcon, { backgroundColor: `${colors.primary}20` }]}>
                    <Ionicons name="camera" size={48} color={colors.primary} />
                  </View>
                  <Text style={[styles.placeholderTitle, { color: colors.text }]}>Your Portrait Here</Text>
                  <Text style={[styles.placeholderText, { color: colors.muted }]}>
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
              <Text style={[styles.freeTrialText, { color: colors.accentGreen }]}>First portrait is FREE!</Text>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View style={[styles.errorBox, { borderColor: colors.destructive }]}>
              <Ionicons name="alert-circle" size={20} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}
        </View>

        {/* Social Share Section (after portrait generated) */}
        {currentPortrait && (
          <View style={[styles.shareCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.shareTitle, { color: colors.text }]}>Share Your Creation</Text>
            <Text style={[styles.shareSubtitle, { color: colors.muted }]}>Show off your adorable pup!</Text>

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
              <Text style={[styles.brandingNoteText, { color: colors.muted }]}>
                Free shares include "Created with Pup Portrait"
              </Text>
            </View>

            {/* Signup prompt after share */}
            <View style={[styles.upgradePrompt, { backgroundColor: colors.background }]}>
              <Text style={[styles.upgradeTitle, { color: colors.text }]}>Want More?</Text>
              <Text style={[styles.upgradeText, { color: colors.muted }]}>
                Sign up for 5 free portraits weekly, save to gallery, and unlock premium features!
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/signup')}
                style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.upgradeButtonText, { color: colors.white }]}>Create Free Account</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>Why Pup Portrait?</Text>

          <View style={styles.featuresGrid}>
            <FeatureCard icon="flash" title="Instant Results" description="AI generates your portrait in seconds" colors={colors} />
            <FeatureCard icon="color-palette" title="Custom Styles" description="Choose from multiple art styles" colors={colors} />
            <FeatureCard icon="share-social" title="Easy Sharing" description="Share directly to social media" colors={colors} />
            <FeatureCard icon="heart" title="100+ Breeds" description="From Golden Retrievers to rare breeds" colors={colors} />
          </View>
        </View>

        {/* Pricing Teaser */}
        <View style={[styles.pricingTeaser, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Text style={[styles.pricingTitle, { color: colors.text }]}>Go Premium</Text>
          <Text style={[styles.pricingSubtitle, { color: colors.muted }]}>Unlock the full experience</Text>

          <View style={styles.pricingFeatures}>
            <PricingFeature text="15 portraits per day" colors={colors} />
            <PricingFeature text="100+ breeds with search" colors={colors} />
            <PricingFeature text="All themes including Events" colors={colors} />
            <PricingFeature text="All aspect ratios" colors={colors} />
            <PricingFeature text="HD 1024px, no watermarks" colors={colors} />
            <PricingFeature text="Custom colors & backgrounds" colors={colors} />
          </View>

          <View style={styles.pricingOptions}>
            <Text style={[styles.pricingFrom, { color: colors.muted }]}>Starting at</Text>
            <Text style={[styles.pricingAmount, { color: colors.text }]}>$7.99<Text style={[styles.pricingPeriod, { color: colors.muted }]}>/mo</Text></Text>
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            style={[styles.pricingButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.pricingButtonText, { color: colors.white }]}>View Plans</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>© 2024 Pup Portrait. All rights reserved.</Text>
          <View style={styles.footerLinks}>
            <Pressable>
              <Text style={[styles.footerLink, { color: colors.muted }]}>Privacy</Text>
            </Pressable>
            <Text style={[styles.footerDivider, { color: colors.muted }]}>•</Text>
            <Pressable>
              <Text style={[styles.footerLink, { color: colors.muted }]}>Terms</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureCard({ icon, title, description, colors }: { icon: string; title: string; description: string; colors: any }) {
  return (
    <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.featureIconContainer, { backgroundColor: `${colors.primary}20` }]}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: colors.muted }]}>{description}</Text>
    </View>
  );
}

function PricingFeature({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.pricingFeature}>
      <Ionicons name="checkmark-circle" size={18} color={colors.accentGreen} />
      <Text style={[styles.pricingFeatureText, { color: colors.mutedLight }]}>{text}</Text>
    </View>
  );
}

function ThemeDropdownItem({ theme, isSelected, colors, onSelect, isLocked }: { theme: Theme; isSelected: boolean; colors: any; onSelect: () => void; isLocked?: boolean }) {
  const inSeason = isThemeInSeason(theme);
  return (
    <Pressable
      onPress={onSelect}
      style={[
        styles.themeDropdownItem,
        { borderBottomColor: colors.border },
        isSelected && { backgroundColor: `${colors.primary}20` },
        isLocked && styles.themeDropdownItemLocked,
      ]}
    >
      <View style={styles.themeDropdownIconWrap}>
        <Ionicons name={theme.icon as any} size={18} color={isLocked ? colors.muted : (isSelected ? colors.primary : colors.muted)} />
        {inSeason && !isLocked && (
          <View style={[styles.miniSeasonBadge, { backgroundColor: `${colors.accent}40` }]}>
            <Ionicons name="sparkles" size={6} color={colors.accent} />
          </View>
        )}
        {isLocked && (
          <View style={[styles.miniLockBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="lock-closed" size={6} color={colors.white} />
          </View>
        )}
      </View>
      <View style={styles.themeDropdownContent}>
        <View style={styles.themeDropdownNameRow}>
          <Text style={[styles.themeDropdownText, { color: isLocked ? colors.muted : colors.text }, isSelected && { color: colors.primary }]}>
            {theme.name}
          </Text>
          {isLocked && (
            <View style={[styles.premiumBadge, { backgroundColor: `${colors.accent}20` }]}>
              <Ionicons name="star" size={10} color={colors.accent} />
              <Text style={[styles.premiumBadgeText, { color: colors.accent }]}>PRO</Text>
            </View>
          )}
        </View>
        {inSeason && !isLocked && <Text style={[styles.themeInSeasonLabel, { color: colors.accent }]}>In Season!</Text>}
      </View>
      {isSelected && !isLocked && <Ionicons name="checkmark" size={18} color={colors.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  themeToggle: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Main Card
  mainCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Selector
  selector: {
    borderWidth: 1,
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
    fontSize: 16,
    fontWeight: '500',
  },

  // Dropdown
  dropdown: {
    borderWidth: 1,
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
  },
  dropdownItemContent: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownItemDesc: {
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
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
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
    borderRadius: 8,
    padding: 2,
  },
  aspectRatioName: {
    fontSize: 12,
    fontWeight: '600',
  },
  aspectRatioDesc: {
    fontSize: 10,
  },

  // Portrait
  portraitContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  portraitCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    textAlign: 'center',
  },
  generatingAnimation: {
    marginBottom: 16,
  },
  generatingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  generatingSubtext: {
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
  watermarkTextContainer: {
    flexDirection: 'column',
  },
  watermarkText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '500',
  },
  watermarkUrl: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '600',
  },
  breedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  breedBadgeText: {
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
    color: '#ffffff',
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
    fontSize: 14,
    fontWeight: '600',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },

  // Share Card
  shareCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  shareTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  shareSubtitle: {
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
    fontSize: 12,
  },
  upgradePrompt: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  upgradeText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  upgradeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Features
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
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
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Pricing
  pricingTeaser: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
  },
  pricingTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  pricingSubtitle: {
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
    fontSize: 14,
  },
  pricingOptions: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingFrom: {
    fontSize: 12,
  },
  pricingAmount: {
    fontSize: 36,
    fontWeight: '800',
  },
  pricingPeriod: {
    fontSize: 16,
    fontWeight: '400',
  },
  pricingButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  pricingButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 8,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLink: {
    fontSize: 12,
  },
  footerDivider: {
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  freeBadgeText: {
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  seasonBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    borderRadius: 6,
    padding: 2,
  },
  featuredThemeName: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  showMoreThemes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '500',
  },
  themesDropdown: {
    borderWidth: 1,
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
  },
  themeDropdownIconWrap: {
    position: 'relative',
  },
  miniSeasonBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    borderRadius: 4,
    padding: 1,
  },
  themeDropdownContent: {
    flex: 1,
  },
  themeDropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  themeInSeasonLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  themeDropdownNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeDropdownItemLocked: {
    opacity: 0.7,
  },
  miniLockBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    borderRadius: 4,
    padding: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  themeCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
  },
  themeCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  proBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
    marginTop: 6,
  },
  proBadgeSmallText: {
    fontSize: 9,
    fontWeight: '700',
  },
  selectedThemePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 10,
    gap: 8,
  },
  selectedThemeText: {
    flex: 1,
    fontSize: 13,
  },
  selectedThemeName: {
    fontWeight: '600',
  },
});
