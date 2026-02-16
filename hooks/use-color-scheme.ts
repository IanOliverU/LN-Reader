import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { ColorSchemeContext } from '@/contexts/color-scheme-context';

export function useColorScheme() {
  const ctx = useContext(ColorSchemeContext);
  const systemScheme = useRNColorScheme();
  if (ctx) {
    return ctx.colorScheme;
  }
  return systemScheme;
}
