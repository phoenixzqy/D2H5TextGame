/**
 * Stealth mode effect hook
 * Applies/removes stealth class to body element
 */

import { useEffect } from 'react';
import { useMetaStore } from '@/stores';

export function useStealthMode() {
  const stealthMode = useMetaStore((state) => state.settings.stealthMode);

  useEffect(() => {
    if (stealthMode) {
      document.body.classList.add('stealth');
    } else {
      document.body.classList.remove('stealth');
    }

    return () => {
      document.body.classList.remove('stealth');
    };
  }, [stealthMode]);
}
