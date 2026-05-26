import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';
import { useThemeStore } from '../../store/theme-store';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthStore();
  const { colors } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: signupError } = await signup(email, password);

    if (signupError) {
      setError(signupError.message);
      setIsLoading(false);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="paw" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Join Pup Portrait and start creating
            </Text>
          </View>

          {/* Benefits */}
          <View style={[styles.benefitsCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.benefitsTitle, { color: colors.text }]}>Free account includes:</Text>
            <BenefitItem text="5 free portraits per week" colors={colors} />
            <BenefitItem text="Save your favorite creations" colors={colors} />
            <BenefitItem text="Access on any device" colors={colors} />
            <BenefitItem text="15 popular breeds to choose from" colors={colors} />
          </View>

          {/* Error */}
          {error && (
            <View style={[styles.errorBox, { borderColor: colors.destructive }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[styles.input, styles.passwordInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            />
          </View>

          {/* Signup Button */}
          <Pressable
            onPress={handleSignup}
            disabled={isLoading}
            style={[styles.signupButton, { backgroundColor: isLoading ? `${colors.primary}80` : colors.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.muted }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Social Login */}
          <View style={styles.socialRow}>
            <Pressable style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text style={[styles.socialText, { color: colors.text }]}>Google</Text>
            </Pressable>
            <Pressable style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="logo-apple" size={20} color={colors.text} />
              <Text style={[styles.socialText, { color: colors.text }]}>Apple</Text>
            </Pressable>
          </View>

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={[styles.loginText, { color: colors.muted }]}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.loginLinkText, { color: colors.primary }]}>Sign In</Text>
            </Pressable>
          </View>

          {/* Terms */}
          <Text style={[styles.terms, { color: colors.muted }]}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BenefitItem({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.benefitItem}>
      <Ionicons name="checkmark-circle" size={18} color={colors.accentGreen} />
      <Text style={[styles.benefitText, { color: colors.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  benefitsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontWeight: '500',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  signupButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  signupButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 18,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLinkText: {
    fontWeight: '500',
    fontSize: 14,
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
