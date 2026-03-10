import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { arrayMove } from '@dnd-kit/sortable';
import { api } from '@/lib/api';
import { SetlistDetail, SetlistSong, Song } from '@/lib/types';
import { RepertoirePanel } from '@/components/Editor/RepertoirePanel';
import { SetlistPanel } from '@/components/Editor/SetlistPanel';

interface EditorLayoutProps {
  setlistId: number;
  bandId: number;
}

export function EditorLayout({ setlistId, bandId }: EditorLayoutProps) {
  const [setlist, setSetlist] = useState<SetlistDetail | null>(null);
  const [repertoire, setRepertoire] = useState<Song[]>([]);
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.setlists.get(setlistId),
      api.songs.list(bandId),
    ]).then(([setlistData, songsData]) => {
      setSetlist(setlistData);
      setSetlistSongs(setlistData.setlist_songs);
      setRepertoire(songsData);
    }).finally(() => setLoading(false));
  }, [setlistId, bandId]);

  const handleAddSong = (song: Song) => {
    const newSetlistSong: SetlistSong = {
      id: Date.now(),
      position: setlistSongs.length + 1,
      song,
      song_performance_config: {
        id: 0,
        lead_vocalist_id: null,
        backup_vocalist_ids: [],
        guitar_solo_id: null,
        instrument_overrides: {},
        free_text_notes: '',
      },
    };
    setSetlistSongs((prev) => [...prev, newSetlistSong]);
  };

  const handleReorder = (activeId: number, overId: number) => {
    setSetlistSongs((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === activeId);
      const newIndex = prev.findIndex((s) => s.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleRemoveSong = (setlistSongId: number) => {
    setSetlistSongs((prev) => prev.filter((s) => s.id !== setlistSongId));
  };

  if (loading || !setlist) return <LoadingContainer>Loading...</LoadingContainer>;

  return (
    <Container>
      <Header>
        <h1>{setlist.name}</h1>
        <HeaderActions>
          <BackLink href="/">← Back</BackLink>
        </HeaderActions>
      </Header>
      <Panels>
        <RepertoirePanel
          songs={repertoire}
          onAddSong={handleAddSong}
          setlistSongIds={setlistSongs.map((ss) => ss.song.id)}
        />
        <SetlistPanel
          setlistSongs={setlistSongs}
          onReorder={handleReorder}
          onRemove={handleRemoveSong}
        />
      </Panels>
    </Container>
  );
}

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Container = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.md};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const BackLink = styled.a`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Panels = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex: 1;
  min-height: 0;
`;


