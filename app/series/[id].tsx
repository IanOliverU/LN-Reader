import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCoverSource } from '@/src/lightnovels/asset-map';
import { manifest } from '@/src/lightnovels/data';
import type { Volume } from '@/src/lightnovels/types';

const COVER_PLACEHOLDER = require('@/assets/images/partial-react-logo.png');

const PAD_H = 12;
const GAP = 16;
const COVER_ASPECT = 2 / 3;

function VolumeCard({
  folder,
  volume,
  cardWidth,
  seriesId,
  seriesName,
}: {
  folder: string;
  volume: Volume;
  cardWidth: number;
  seriesId: string;
  seriesName: string;
}) {
  const router = useRouter();
  const coverSource = getCoverSource(folder, volume.coverFilename);

  const openReader = () => {
    router.push({
      pathname: '/reader',
      params: {
        folder: encodeURIComponent(folder),
        pdf: encodeURIComponent(volume.pdfFilename),
        title: encodeURIComponent(volume.title),
        seriesId: encodeURIComponent(seriesId),
        seriesName: encodeURIComponent(seriesName),
        coverFilename: encodeURIComponent(volume.coverFilename),
      },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        pressed && styles.cardPressed,
      ]}
      onPress={openReader}
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
        {volume.title}
      </ThemedText>
    </Pressable>
  );
}

export default function SeriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const series = manifest.series.find((s) => s.id === id);
  const cardWidth = (width - PAD_H * 2 - GAP) / 2;

  const navigation = useNavigation();
  useEffect(() => {
    if (series) navigation.setOptions({ title: series.name });
  }, [series, navigation]);

  if (!series) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Series not found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {series.volumes.length === 0 ? (
        <ThemedText style={styles.empty}>No volumes yet.</ThemedText>
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {series.volumes.map((vol) => (
            <VolumeCard
              key={vol.pdfFilename}
              folder={series.folder}
              volume={vol}
              cardWidth={cardWidth}
              seriesId={series.id}
              seriesName={series.name}
            />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  empty: {
    paddingHorizontal: 20,
    paddingTop: 8,
    opacity: 0.7,
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
