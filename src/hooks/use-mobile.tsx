'use client';

import { useState, useEffect } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Set initial value.
    // This will only run on the client, avoiding hydration errors.
    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mediaQuery.matches);

    // Add listener for changes
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    mediaQuery.addEventListener('change', handler);

    // Cleanup listener on component unmount
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
