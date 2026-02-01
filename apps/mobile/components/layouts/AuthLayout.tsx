import { ReactNode } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, type Href } from 'expo-router';
import { Card } from '@tymblok/ui';
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
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Ambient glow effects */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute -top-[300px] left-1/2 -ml-[400px] w-[800px] h-[800px] rounded-full bg-indigo-500/5" />
        <View className="absolute -bottom-[300px] -right-[300px] w-[600px] h-[600px] rounded-full bg-purple-500/[0.03]" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-5 py-4">
            {/* Branding */}
            <View className="items-center mb-6">
              {showLogo && <TymblokLogo size="md" style={{ marginBottom: 12 }} />}
              <Text className="text-xl font-bold text-white">{title}</Text>
              {subtitle && (
                <Text className="mt-1 text-sm text-slate-400">{subtitle}</Text>
              )}
            </View>

            {/* Card with form content */}
            <Card variant="outlined" padding="lg">
              {children}
            </Card>

            {/* Footer link */}
            {footer && (
              <View className="flex-row justify-center mt-5">
                <Text className="text-sm text-slate-400">{footer.text} </Text>
                <Link href={footer.href} asChild>
                  <Pressable>
                    <Text className="text-sm font-semibold text-indigo-500">
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
