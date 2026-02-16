import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorSchemeContext } from '@/contexts/color-scheme-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SettingsModal() {
  const router = useRouter();
  const { preference, setPreference } = useColorSchemeContext();
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <ThemedText type="link">Done</ThemedText>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Appearance
        </ThemedText>

        <View style={styles.optionList}>
          <OptionRow
            label="Light"
            selected={preference === 'light'}
            onPress={() => setPreference('light')}
            iconColor={iconColor}
            tintColor={tintColor}
          />
          <OptionRow
            label="Dark"
            selected={preference === 'dark'}
            onPress={() => setPreference('dark')}
            iconColor={iconColor}
            tintColor={tintColor}
          />
          <OptionRow
            label="System"
            subtitle="Follow device setting"
            selected={preference === 'system'}
            onPress={() => setPreference('system')}
            iconColor={iconColor}
            tintColor={tintColor}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function OptionRow({
  label,
  subtitle,
  selected,
  onPress,
  iconColor,
  tintColor,
}: {
  label: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  iconColor: string;
  tintColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionRow,
        pressed && styles.pressed,
        selected && styles.optionRowSelected,
      ]}
    >
      <View style={styles.optionLabel}>
        <ThemedText type="defaultSemiBold">{label}</ThemedText>
        {subtitle && (
          <ThemedText style={styles.optionSubtitle}>{subtitle}</ThemedText>
        )}
      </View>
      {selected && (
        <IconSymbol name="checkmark" size={22} color={tintColor} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    marginBottom: 12,
    opacity: 0.8,
  },
  optionList: {
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(10, 126, 164, 0.15)',
  },
  optionLabel: {
    flex: 1,
  },
  optionSubtitle: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
});
