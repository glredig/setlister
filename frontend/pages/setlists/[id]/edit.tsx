import { useRouter } from 'next/router';
import { useBand } from '@/contexts/BandContext';
import { EditorLayout } from '@/components/Editor/EditorLayout';

export default function EditSetlist() {
  const router = useRouter();
  const { id } = router.query;
  const { band, loading } = useBand();

  if (loading || !band || !id) return null;

  return <EditorLayout setlistId={Number(id)} bandId={band.id} />;
}
