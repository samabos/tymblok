import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService } from '../../services/authService';
import { TymblokLogo } from '../../components/icons';
import { Ionicons } from '@expo/vector-icons';

type ScreenState = 'form' | 'success';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('form');

  const isValid = email.includes('@');

  const handleSubmit = async () => {
    if (!isValid) return;

    setError(null);
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      console.log('[ForgotPassword] Reset email sent to:', email);
      setScreenState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (screenState === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <View className="flex-1 justify-center p-6">
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-3xl items-center justify-center mb-4 bg-green-500">
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text className="text-2xl font-bold text-white text-center">
              Check your email
            </Text>
            <Text className="text-base text-slate-400 text-center mt-2">
              {"We've sent a password reset link to"}
            </Text>
            <Text className="text-base text-white font-medium text-center mt-1">
              {email}
            </Text>
          </View>

          <TouchableOpacity
            className="bg-indigo-500 rounded-xl p-4 items-center mt-4"
            onPress={handleBack}
          >
            <Text className="text-white text-base font-semibold">Back to login</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mt-6">
            <Text className="text-slate-400 text-sm">{"Didn't receive the email? "}</Text>
            <Pressable onPress={handleResend} disabled={isLoading}>
              <Text className="text-indigo-500 text-sm font-semibold">
                {isLoading ? 'Sending...' : 'Click to resend'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 justify-center p-6">
        <View className="items-center mb-6">
          <TymblokLogo size="md" style={{ marginBottom: 12 }} />
          <Text className="text-2xl font-bold text-white text-center">
            Forgot password?
          </Text>
          <Text className="text-base text-slate-400 text-center mt-2">
            {"No worries, we'll send you reset instructions."}
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-slate-200">Email</Text>
            <TextInput
              className="bg-slate-800 rounded-xl p-4 text-white text-base border border-slate-700"
              placeholder="you@example.com"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
              editable={!isLoading}
            />
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <Text className="text-sm text-red-400 text-center">{error}</Text>
            </View>
          )}

          <TouchableOpacity
            className={`bg-indigo-500 rounded-xl p-4 items-center mt-2 ${
              !isValid || isLoading ? 'opacity-50' : ''
            }`}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
          >
            <Text className="text-white text-base font-semibold">
              {isLoading ? 'Sending...' : 'Reset Password'}
            </Text>
          </TouchableOpacity>
        </View>

        <Pressable className="mt-6 items-center" onPress={handleBack}>
          <Text className="text-indigo-500 text-sm font-semibold">Back to login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
