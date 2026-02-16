import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StyleSheet, View, useColorScheme } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

function PulsingDot({ delay, color }: { delay: number; color: string }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.4, { duration: 500 })
        ),
        -1
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

function LoadingDots({ color }: { color: string }) {
  return (
    <View style={styles.dotsContainer}>
      <PulsingDot delay={0} color={color} />
      <PulsingDot delay={150} color={color} />
      <PulsingDot delay={300} color={color} />
    </View>
  );
}

export function LoadingScreen({ onFinish }: { onFinish?: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? '#0d0d12' : '#ffffff';
  const accentColor = isDark ? '#c9a962' : '#8b6914';
  const textColor = isDark ? '#f5f0e8' : '#2c2416';
  const subtextColor = isDark ? '#9a8f7a' : '#6b5d4a';

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
      // Show our immersive screen for a moment, then fade out
      hideTimer = setTimeout(() => onFinish?.(), 1200);
    };
    const timer = setTimeout(hideSplash, 500);

    return () => {
      clearTimeout(timer);
      if (hideTimer != null) clearTimeout(hideTimer);
    };
  }, [onFinish]);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(500)}
      style={[styles.container, { backgroundColor }]}
    >
      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.iconWrapper}
        >
          <View style={[styles.iconCircle, { borderColor: accentColor }]}>
            <MaterialIcons
              name="menu-book"
              size={56}
              color={accentColor}
              style={styles.icon}
            />
          </View>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(400).duration(500)}
          style={[styles.title, { color: textColor }]}
        >
          LN Reader
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(550).duration(400)}
          style={[styles.subtitle, { color: subtextColor }]}
        >
          Your library awaits
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(700).duration(400)}
          style={styles.loaderWrapper}
        >
          <LoadingDots color={accentColor} />
        </Animated.View>
      </View>

      {/* Bottom accent line */}
      <Animated.View
        entering={FadeIn.delay(900).duration(600)}
        style={[styles.accentLine, { backgroundColor: accentColor }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    ...(Platform.OS === 'ios' && { marginLeft: 2 }),
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 2,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  loaderWrapper: {
    marginTop: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});
