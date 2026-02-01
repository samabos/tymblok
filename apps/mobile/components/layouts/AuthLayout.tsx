import { ReactNode } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, type Href } from 'expo-router';
import { useTheme, Card } from '@tymblok/ui';
import { colors, spacing, typography } from '@tymblok/theme';
import { TymblokLogo } from '../icons';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  footer?: {
    text: string;
    linkText: string;
    href: Href;
  };
}

export function AuthLayout({
  children,
  title = 'Tymblok',
  subtitle,
  showLogo = true,
  footer,
}: AuthLayoutProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      {/* Ambient glow effects */}
      <View style={styles.ambientContainer}>
        <View style={styles.topGlow} />
        <View style={styles.bottomGlow} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Branding */}
            <View style={styles.brandingContainer}>
              {showLogo && <TymblokLogo size="md" style={styles.logo} />}
              <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Card with form content */}
            <Card variant="outlined" padding="lg">
              {children}
            </Card>

            {/* Footer link */}
            {footer && (
              <View style={styles.footerContainer}>
                <Text style={[styles.footerText, { color: themeColors.textMuted }]}>
                  {footer.text}{' '}
                </Text>
                <Link href={footer.href} asChild>
                  <Pressable>
                    <Text style={[styles.footerLink, { color: colors.indigo[500] }]}>
                      {footer.linkText}
                    </Text>
                  </Pressable>
                </Link>
              </View>
            )}
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
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: -300,
    left: '50%',
    marginLeft: -400,
    width: 800,
    height: 800,
    borderRadius: 9999,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: -300,
    right: -300,
    width: 600,
    height: 600,
    borderRadius: 9999,
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
  // Footer
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[5],
  },
  footerText: {
    fontSize: typography.sizes.sm,
  },
  footerLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
