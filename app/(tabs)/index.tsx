import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCoverSource } from '@/src/lightnovels/asset-map';
import { manifest } from '@/src/lightnovels/data';
import type { Series } from '@/src/lightnovels/types';
import { getPagesReadToday } from '@/src/stats/storage';

const COVER_PLACEHOLDER = require('@/assets/images/partial-react-logo.png');

const PAD_H = 12;
const GAP = 16;
const COVER_ASPECT = 2 / 3;

function SeriesCard({
  series,
  cardWidth,
}: {
  series: Series;
  cardWidth: number;
}) {
  const router = useRouter();
  const firstVolume = series.volumes[0];
  const coverSource = firstVolume
    ? getCoverSource(series.folder, firstVolume.coverFilename)
    : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push(`/series/${series.id}`)}
    >
      <ThemedView
        style={[styles.coverContainer, { width: cardWidth, aspectRatio: COVER_ASPECT }]}
      >
        <Image
          source={coverSource ?? COVER_PLACEHOLDER}
          style={styles.cover}
          contentFit="cover"
        />
      </ThemedView>
      <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={2}>
        {series.name}
      </ThemedText>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = (width - PAD_H * 2 - GAP) / 2;
  const iconColor = useThemeColor({}, 'icon');
  const [pagesToday, setPagesToday] = useState(0);

  useFocusEffect(
    useCallback(() => {
      getPagesReadToday().then(setPagesToday);
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title" style={styles.header}>
          Library
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
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {manifest.series.map((series) => (
          <SeriesCard key={series.id} series={series} cardWidth={cardWidth} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PAD_H,
    gap: GAP,
    paddingBottom: 24,
  },
  card: {},
  cardPressed: {
    opacity: 0.8,
  },
  coverContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  title: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
});
