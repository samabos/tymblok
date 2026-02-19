import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@tymblok/ui';
import { colors } from '@tymblok/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSupportContent } from '../../services/apiHooks';

export default function SupportContentScreen() {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: content, isLoading, error, refetch } = useSupportContent(slug || '');

  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="px-5 py-4 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 -ml-2 rounded-xl"
            style={{ backgroundColor: themeColors.input }}
          >
            <Ionicons name="arrow-back" size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo[500]} />
          <Text style={{ color: themeColors.textMuted, marginTop: 16 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
        <View className="px-5 py-4 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 -ml-2 rounded-xl"
            style={{ backgroundColor: themeColors.input }}
          >
            <Ionicons name="arrow-back" size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}
        >
          <Ionicons name="alert-circle-outline" size={48} color={colors.status.urgent} />
          <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 16, color: themeColors.text }}>
            Failed to load content
          </Text>
          <Text
            style={{
              fontSize: 14,
              marginTop: 8,
              textAlign: 'center',
              color: themeColors.textMuted,
            }}
          >
            {error.message || 'Something went wrong'}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.indigo[500],
            }}
            onPress={() => refetch()}
          >
            <Text style={{ color: colors.white, fontWeight: '500' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2 rounded-xl"
          style={{ backgroundColor: themeColors.input }}
        >
          <Ionicons name="arrow-back" size={20} color={themeColors.text} />
        </TouchableOpacity>
        <Text
          className="text-xl font-bold flex-1"
          style={{ color: themeColors.text }}
          numberOfLines={1}
        >
          {content?.title || ''}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {content?.content && (
          <MarkdownRenderer content={content.content} themeColors={themeColors} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Simple markdown renderer for support content */
function MarkdownRenderer({
  content,
  themeColors,
}: {
  content: string;
  themeColors: Record<string, string>;
}) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('## ')) {
      elements.push(
        <Text
          key={i}
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: themeColors.text,
            marginTop: i === 0 ? 0 : 24,
            marginBottom: 8,
          }}
        >
          {line.slice(3)}
        </Text>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <Text
          key={i}
          style={{
            fontSize: 17,
            fontWeight: '600',
            color: themeColors.text,
            marginTop: 20,
            marginBottom: 6,
          }}
        >
          {line.slice(4)}
        </Text>
      );
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <Text
          key={i}
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: themeColors.text,
            marginTop: 12,
            marginBottom: 4,
          }}
        >
          {line.slice(2, -2)}
        </Text>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <View key={i} style={{ flexDirection: 'row', marginTop: 4, paddingLeft: 8 }}>
          <Text style={{ color: themeColors.textMuted, marginRight: 8 }}>{'\u2022'}</Text>
          <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: themeColors.textMuted }}>
            {renderInlineFormatting(line.slice(2), themeColors)}
          </Text>
        </View>
      );
    } else if (line.trim() === '') {
      elements.push(<View key={i} style={{ height: 8 }} />);
    } else {
      elements.push(
        <Text
          key={i}
          style={{ fontSize: 15, lineHeight: 22, color: themeColors.textMuted, marginTop: 2 }}
        >
          {renderInlineFormatting(line, themeColors)}
        </Text>
      );
    }
  }

  return <>{elements}</>;
}

/** Render inline bold text within a line */
function renderInlineFormatting(
  text: string,
  themeColors: Record<string, string>
): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '600', color: themeColors.text }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}
