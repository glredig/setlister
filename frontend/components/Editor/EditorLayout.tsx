import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { arrayMove } from '@dnd-kit/sortable';
import { api } from '@/lib/api';
import { SetlistDetail, SetlistSong, Song, Member, SongPerformanceConfig } from '@/lib/types';
import { RepertoirePanel } from '@/components/Editor/RepertoirePanel';
import { SetlistPanel } from '@/components/Editor/SetlistPanel';
import { useMember } from '@/contexts/MemberContext';

interface EditorLayoutProps {
  setlistId: number;
  bandId: number;
  members: Member[];
}

export function EditorLayout({ setlistId, bandId, members }: EditorLayoutProps) {
  const [setlist, setSetlist] = useState<SetlistDetail | null>(null);
  const [repertoire, setRepertoire] = useState<Song[]>([]);
  const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [gapSeconds, setGapSeconds] = useState<number>(30);
  const { currentMember } = useMember();
  const [memberNotes, setMemberNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([
      api.setlists.get(setlistId),
      api.songs.list(bandId),
    ]).then(([setlistData, songsData]) => {
      setSetlist(setlistData);
      setSetlistSongs(setlistData.setlist_songs);
      setRepertoire(songsData);
      setGapSeconds(setlistData.inter_song_gap_seconds);
    }).finally(() => setLoading(false));
  }, [setlistId, bandId]);

  useEffect(() => {
    if (!currentMember || loading) return;

    api.memberSongNotes.list(setlistId, currentMember.id).then((notes) => {
      const noteMap: Record<number, string> = {};
      notes.forEach((n) => { noteMap[n.setlist_song_id] = n.note; });
      setMemberNotes(noteMap);
    });
  }, [currentMember, setlistId, loading]);

  const handleAddSong = (song: Song) => {
    const newSetlistSong: SetlistSong = {
      id: Date.now(),
      position: setlistSongs.length + 1,
      song,
      song_performance_config: {
        id: 0,
        lead_vocalist_ids: [],
        backup_vocalist_ids: [],
        solos: [],
        instrument_overrides: {},
        free_text_notes: '',
      },
    };
    setSetlistSongs((prev) => [...prev, newSetlistSong]);
    setIsDirty(true);
  };

  const handleReorder = (activeId: number, overId: number) => {
    setSetlistSongs((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === activeId);
      const newIndex = prev.findIndex((s) => s.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setIsDirty(true);
  };

  const handleRemoveSong = (setlistSongId: number) => {
    setSetlistSongs((prev) => prev.filter((s) => s.id !== setlistSongId));
    setIsDirty(true);
  };

  const handleToggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleConfigChange = (setlistSongId: number, updatedConfig: SongPerformanceConfig) => {
    setSetlistSongs((prev) =>
      prev.map((ss) =>
        ss.id === setlistSongId
          ? { ...ss, song_performance_config: updatedConfig }
          : ss
      )
    );
    setIsDirty(true);
  };

  const handleGapChange = (gap: number) => {
    setGapSeconds(gap);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!setlist) return;
    setIsSaving(true);
    try {
      await api.setlists.update(setlist.id, { inter_song_gap_seconds: gapSeconds });
      const songs = setlistSongs.map((ss, index) => ({
        song_id: ss.song.id,
        position: index + 1,
        performance_config: {
          lead_vocalist_ids: ss.song_performance_config.lead_vocalist_ids,
          backup_vocalist_ids: ss.song_performance_config.backup_vocalist_ids,
          solos: ss.song_performance_config.solos,
          instrument_overrides: ss.song_performance_config.instrument_overrides,
          free_text_notes: ss.song_performance_config.free_text_notes,
        },
      }));
      const updated = await api.setlistSongs.bulkUpdate(setlist.id, songs);
      setSetlist(updated);
      setSetlistSongs(updated.setlist_songs);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!setlist) return;
    setSetlistSongs(setlist.setlist_songs);
    setGapSeconds(setlist.inter_song_gap_seconds);
    setIsDirty(false);
  };

  if (loading || !setlist) return <LoadingContainer>Loading...</LoadingContainer>;

  return (
    <Container>
      <Header>
        <h1>{setlist.name}</h1>
        <HeaderActions>
          <BackLink href="/">← Back</BackLink>
          <CancelButton onClick={handleCancel} disabled={!isDirty}>
            Cancel
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={!isDirty || isSaving} aria-label="Save">
            {isSaving ? 'Saving...' : 'Save'}
          </SaveButton>
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
          expandedId={expandedId}
          onToggleExpand={handleToggleExpand}
          onConfigChange={handleConfigChange}
          members={members}
          gapSeconds={gapSeconds}
          onGapChange={handleGapChange}
          memberNotes={memberNotes}
          currentMemberId={currentMember?.id ?? null}
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
  height: 100%;
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

const CancelButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  cursor: pointer;
  font-size: 0.9rem;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const SaveButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 4px;
  color: white;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;


