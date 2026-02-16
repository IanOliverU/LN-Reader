import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { LoadingScreen } from '@/components/loading-screen';
import { ColorSchemeProvider } from '@/contexts/color-scheme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutInner() {
  const colorScheme = useColorScheme();
  const [isLoading, setIsLoading] = useState(true);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={StyleSheet.absoluteFill}>
        <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="series/[id]"
          options={{ title: '', headerBackTitle: 'Library' }}
        />
        <Stack.Screen
          name="reader"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Settings' }} />
        </Stack>
        <StatusBar style="auto" />
        {isLoading && (
          <LoadingScreen onFinish={() => setIsLoading(false)} />
        )}
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ColorSchemeProvider>
      <RootLayoutInner />
    </ColorSchemeProvider>
  );
}
