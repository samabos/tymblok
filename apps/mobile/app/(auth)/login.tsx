import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, type Href } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../services/authService';
import { Input, Button, useTheme } from '@tymblok/ui';
import { colors, spacing, borderRadius, typography } from '@tymblok/theme';
import { EnvelopeIcon } from 'react-native-heroicons/outline';
import { GoogleIcon, GitHubIcon, TymblokLogo } from '../../components/icons';

export default function LoginScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    console.log('[Login] Starting login for:', email);
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      console.log('[Login] Response received:', response);

      setAuth(
        {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          avatar_url: response.user.avatarUrl,
          timezone: 'UTC',
          working_hours_start: '09:00',
          working_hours_end: '17:00',
          lunch_start: '12:00',
          lunch_duration_minutes: 60,
          created_at: response.user.createdAt,
          updated_at: response.user.createdAt,
        },
        {
          access_token: response.accessToken,
          refresh_token: response.refreshToken,
          expires_in: response.expiresIn,
          token_type: 'Bearer',
        }
      );

      router.replace('/(tabs)/today');
    } catch (error: unknown) {
      console.log('[Login] Error:', error);
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Ambient glow effects */}
      <View style={styles.ambientContainer}>
        <View style={[styles.ambientGlow, styles.topGlow]} />
        <View style={[styles.ambientGlow, styles.bottomGlow]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo & Branding */}
            <View style={styles.brandingContainer}>
              <TymblokLogo size="md" style={styles.logo} />
              <Text style={[styles.title, { color: themeColors.text }]}>Tymblok</Text>
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                Time blocking for developers
              </Text>
            </View>

            {/* Login Card */}
            <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.formContainer}>
                {/* Email Input */}
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChangeText={setEmail}
                  disabled={isLoading}
                  rightIcon={<EnvelopeIcon size={20} color={themeColors.textFaint} strokeWidth={1.5} />}
                />

                {/* Password Input */}
                <View style={styles.passwordContainer}>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    disabled={isLoading}
                  />
                </View>

                {/* Forgot Password */}
                <Pressable style={styles.forgotContainer} onPress={() => {}}>
                  <Text style={[styles.forgotText, { color: colors.indigo[500] }]}>
                    Forgot password?
                  </Text>
                </Pressable>

                {/* Login Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={!email || !password}
                  onPress={handleLogin}
                >
                  Sign in
                </Button>
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
                <View style={styles.dividerTextContainer}>
                  <Text style={[styles.dividerText, { backgroundColor: themeColors.card, color: themeColors.textFaint }]}>
                    or continue with
                  </Text>
                </View>
              </View>

              {/* Social Login */}
              <View style={styles.socialRow}>
                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: themeColors.borderSubtle, backgroundColor: themeColors.input + '80' }]}
                  activeOpacity={0.7}
                >
                  <GoogleIcon size={20} />
                  <Text style={[styles.socialText, { color: themeColors.text }]}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.socialButton, { borderColor: themeColors.borderSubtle, backgroundColor: themeColors.input + '80' }]}
                  activeOpacity={0.7}
                >
                  <GitHubIcon size={20} color={themeColors.text} />
                  <Text style={[styles.socialText, { color: themeColors.text }]}>GitHub</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: themeColors.textMuted }]}>
                {"Don't have an account? "}
              </Text>
              <Link href={'/(auth)/register' as Href} asChild>
                <Pressable>
                  <Text style={[styles.signupLink, { color: colors.indigo[500] }]}>Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  // Ambient glow
  ambientContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    borderRadius: 9999,
  },
  topGlow: {
    top: -300,
    left: '50%',
    marginLeft: -400,
    width: 800,
    height: 800,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  bottomGlow: {
    bottom: -300,
    right: -300,
    width: 600,
    height: 600,
    backgroundColor: 'rgba(168, 85, 247, 0.03)',
  },
  // Branding
  brandingContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logo: {
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    marginTop: spacing[1],
    fontSize: typography.sizes.sm,
  },
  // Card
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing[5],
  },
  formContainer: {
    gap: spacing[4],
  },
  passwordContainer: {
    // Additional spacing handled by Input component
  },
  forgotContainer: {
    alignItems: 'flex-end',
  },
  forgotText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  // Divider
  dividerContainer: {
    position: 'relative',
    marginVertical: spacing[4],
  },
  dividerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
  },
  dividerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dividerText: {
    paddingHorizontal: spacing[3],
    fontSize: typography.sizes.sm,
  },
  // Social
  socialRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  socialText: {
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.sm,
  },
  // Sign Up
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[5],
  },
  signupText: {
    fontSize: typography.sizes.sm,
  },
  signupLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
