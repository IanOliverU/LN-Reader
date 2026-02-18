import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getHistory } from '@/src/history/storage';
import type { HistoryEntry } from '@/src/history/types';
import { getCoverSource } from '@/src/lightnovels/asset-map';
import { getPagesReadToday } from '@/src/stats/storage';

const COVER_PLACEHOLDER = require('@/assets/images/partial-react-logo.png');

function HistoryRow({
  entry,
  onPress,
}: {
  entry: HistoryEntry;
  onPress: () => void;
}) {
  const coverSource = getCoverSource(entry.folder, entry.coverFilename);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <ThemedView style={styles.coverWrap}>
        <Image
          source={coverSource ?? COVER_PLACEHOLDER}
          style={styles.cover}
          contentFit="cover"
        />
      </ThemedView>
      <ThemedView style={styles.info}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {entry.seriesName}
        </ThemedText>
        <ThemedText style={styles.volumeTitle} numberOfLines={1}>
          {entry.volumeTitle}
        </ThemedText>
        <ThemedText style={styles.pageText}>Stopped on page {entry.lastPage}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [pagesToday, setPagesToday] = useState(0);
  const iconColor = useThemeColor({}, 'icon');

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setEntries);
      getPagesReadToday().then(setPagesToday);
    }, [])
  );

  const openReader = useCallback(
    (entry: HistoryEntry) => {
      router.push({
        pathname: '/reader',
        params: {
          folder: encodeURIComponent(entry.folder),
          pdf: encodeURIComponent(entry.pdfFilename),
          title: encodeURIComponent(entry.volumeTitle),
          seriesId: encodeURIComponent(entry.seriesId),
          seriesName: encodeURIComponent(entry.seriesName),
          coverFilename: encodeURIComponent(entry.coverFilename),
          initialPage: String(entry.lastPage),
        },
      });
    },
    [router]
  );

  if (entries.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.header}>
            History
          </ThemedText>
          <Pressable
            onPress={() => router.push('/modal')}
            style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
            hitSlop={12}
          >
            <IconSymbol name="gearshape.fill" size={24} color={iconColor} />
          </Pressable>
        </View>
        {pagesToday > 0 && (
          <ThemedView style={styles.statsCard}>
            <ThemedText style={styles.statsText}>
              {pagesToday} {pagesToday === 1 ? 'page' : 'pages'} read today
            </ThemedText>
          </ThemedView>
        )}
        <ThemedText style={styles.empty}>No recent reads. Open a volume from Library to start.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={styles.header}>
          History
        </ThemedText>
        <Pressable
          onPress={() => router.push('/modal')}
          style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
          hitSlop={12}
        >
          <IconSymbol name="gearshape.fill" size={24} color={iconColor} />
        </Pressable>
      </View>
      {pagesToday > 0 && (
        <ThemedView style={styles.statsCard}>
          <ThemedText style={styles.statsText}>
            {pagesToday} {pagesToday === 1 ? 'page' : 'pages'} read today
          </ThemedText>
        </ThemedView>
      )}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <HistoryRow entry={item} onPress={() => openReader(item)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const COVER_SIZE = 56;
const COVER_ASPECT = 2 / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    flex: 1,
  },
  settingsBtn: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 126, 164, 0.12)',
  },
  statsText: {
    fontSize: 14,
    opacity: 0.9,
  },
  empty: {
    paddingHorizontal: 20,
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 14,
  },
  rowPressed: {
    opacity: 0.8,
  },
  coverWrap: {
    width: COVER_SIZE,
    height: COVER_SIZE / COVER_ASPECT,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  volumeTitle: {
    marginTop: 2,
    opacity: 0.9,
  },
  pageText: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.7,
  },
});
