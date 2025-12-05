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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthStore();

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
      className="flex-1 bg-background"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 py-8 justify-center">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4">
              <Ionicons name="paw" size={40} color="#6366f1" />
            </View>
            <Text className="text-white text-2xl font-bold">Create Account</Text>
            <Text className="text-muted-foreground text-center mt-2">
              Join Pup Portrait and start creating
            </Text>
          </View>

          {/* Benefits */}
          <View className="bg-card rounded-xl p-4 mb-6">
            <Text className="text-white font-medium mb-3">Free account includes:</Text>
            <View className="space-y-2">
              <BenefitItem text="3 free portraits per day" />
              <BenefitItem text="Save your favorite creations" />
              <BenefitItem text="Access on any device" />
              <BenefitItem text="15+ dog breeds to choose from" />
            </View>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-destructive/20 border border-destructive rounded-xl p-4 mb-4">
              <Text className="text-destructive text-center">{error}</Text>
            </View>
          )}

          {/* Form */}
          <View className="mb-6">
            <Text className="text-white font-medium mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#a1a1aa"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              className="bg-card border border-border rounded-xl p-4 text-white mb-4"
            />

            <Text className="text-white font-medium mb-2">Password</Text>
            <View className="relative mb-4">
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor="#a1a1aa"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="bg-card border border-border rounded-xl p-4 text-white pr-12"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#a1a1aa"
                />
              </Pressable>
            </View>

            <Text className="text-white font-medium mb-2">Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor="#a1a1aa"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              className="bg-card border border-border rounded-xl p-4 text-white"
            />
          </View>

          {/* Signup Button */}
          <Pressable
            onPress={handleSignup}
            disabled={isLoading}
            className={`rounded-xl p-4 items-center mb-4 ${
              isLoading ? 'bg-primary/50' : 'bg-primary'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-lg">Create Account</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-border" />
            <Text className="text-muted-foreground mx-4">or continue with</Text>
            <View className="flex-1 h-px bg-border" />
          </View>

          {/* Social Login */}
          <View className="flex-row gap-4 mb-6">
            <Pressable className="flex-1 bg-card border border-border rounded-xl p-4 flex-row items-center justify-center">
              <Ionicons name="logo-google" size={20} color="#ea4335" />
              <Text className="text-white ml-2">Google</Text>
            </Pressable>
            <Pressable className="flex-1 bg-card border border-border rounded-xl p-4 flex-row items-center justify-center">
              <Ionicons name="logo-apple" size={20} color="white" />
              <Text className="text-white ml-2">Apple</Text>
            </Pressable>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center">
            <Text className="text-muted-foreground">Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text className="text-primary font-medium">Sign In</Text>
            </Pressable>
          </View>

          {/* Terms */}
          <Text className="text-muted-foreground text-center text-xs mt-6">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <View className="flex-row items-center mb-2">
      <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
      <Text className="text-muted-foreground ml-2">{text}</Text>
    </View>
  );
}
