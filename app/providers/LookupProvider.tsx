'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { EMPTY_LOOKUPS, fetchLookups, type LookupData } from '../lib/lookups';

const LookupContext = createContext<LookupData>(EMPTY_LOOKUPS);

export function useLookups() {
  return useContext(LookupContext);
}

export function LookupProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LookupData>(EMPTY_LOOKUPS);

  useEffect(() => {
    fetchLookups()
      .then(setData)
      .catch(() => {
        // Silently fail — pages will show empty dropdowns
      });
  }, []);

  return (
    <LookupContext.Provider value={data}>
      {children}
    </LookupContext.Provider>
  );
}
