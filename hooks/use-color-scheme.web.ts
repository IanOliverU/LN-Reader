import { useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { ColorSchemeContext } from '@/contexts/color-scheme-context';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const ctx = useContext(ColorSchemeContext);
  const systemScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (!hasHydrated) {
    return 'light' as const;
  }

  if (ctx) {
    return ctx.colorScheme;
  }

  return systemScheme;
}
