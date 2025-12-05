import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: loginError } = await login(email, password);

    if (loginError) {
      setError(loginError.message);
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
      <View className="flex-1 px-6 py-8 justify-center">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-primary/20 rounded-full items-center justify-center mb-4">
            <Ionicons name="paw" size={40} color="#6366f1" />
          </View>
          <Text className="text-white text-2xl font-bold">Welcome Back</Text>
          <Text className="text-muted-foreground text-center mt-2">
            Sign in to continue creating portraits
          </Text>
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
          <View className="relative">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
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
        </View>

        {/* Login Button */}
        <Pressable
          onPress={handleLogin}
          disabled={isLoading}
          className={`rounded-xl p-4 items-center mb-4 ${
            isLoading ? 'bg-primary/50' : 'bg-primary'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-lg">Sign In</Text>
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

        {/* Sign Up Link */}
        <View className="flex-row justify-center">
          <Text className="text-muted-foreground">Don't have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-primary font-medium">Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
