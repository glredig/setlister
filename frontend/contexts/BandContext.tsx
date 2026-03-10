import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { Band } from '@/lib/types';

interface BandContextValue {
  band: Band | null;
  loading: boolean;
  error: string | null;
}

const BandContext = createContext<BandContextValue>({
  band: null,
  loading: true,
  error: null,
});

export function BandProvider({ bandId, children }: { bandId: number; children: ReactNode }) {
  const [band, setBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.bands.get(bandId)
      .then(setBand)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bandId]);

  return (
    <BandContext.Provider value={{ band, loading, error }}>
      {children}
    </BandContext.Provider>
  );
}

export function useBand() {
  return useContext(BandContext);
}
