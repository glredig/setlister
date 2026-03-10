import { useBand } from '@/contexts/BandContext';
import { Dashboard } from '@/components/Dashboard/Dashboard';

export default function Home() {
  const { band, loading } = useBand();

  if (loading || !band) return null;

  return <Dashboard bandId={band.id} />;
}
