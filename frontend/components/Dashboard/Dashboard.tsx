import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '@/lib/api';
import { Setlist } from '@/lib/types';
import { SetlistCard } from '@/components/Dashboard/SetlistCard';

interface DashboardProps {
  bandId: number;
}

export function Dashboard({ bandId }: DashboardProps) {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.setlists.list(bandId)
      .then(setSetlists)
      .finally(() => setLoading(false));
  }, [bandId]);

  const handleDelete = async (id: number) => {
    await api.setlists.delete(id);
    setSetlists((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <Container><p>Loading...</p></Container>;

  return (
    <Container>
      <Header>
        <h1>Setlists</h1>
      </Header>
      {setlists.length === 0 ? (
        <EmptyState>No setlists yet. Create your first one!</EmptyState>
      ) : (
        <SetlistGrid>
          {setlists.map((setlist) => (
            <SetlistCard key={setlist.id} setlist={setlist} onDelete={handleDelete} />
          ))}
        </SetlistGrid>
      )}
    </Container>
  );
}

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const EmptyState = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const SetlistGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;
