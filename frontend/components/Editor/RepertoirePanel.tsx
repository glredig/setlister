import { useState, useMemo } from 'react';
import styled from 'styled-components';
import { Song } from '@/lib/types';
import { RepertoireSongRow } from '@/components/Editor/RepertoireSongRow';

interface RepertoirePanelProps {
  songs: Song[];
  onAddSong: (song: Song) => void;
  setlistSongIds: number[];
}

export function RepertoirePanel({ songs, onAddSong, setlistSongIds }: RepertoirePanelProps) {
  const [query, setQuery] = useState('');

  const filteredSongs = useMemo(() => {
    if (!query.trim()) return songs;
    const q = query.toLowerCase();
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
    );
  }, [songs, query]);

  const setlistSongIdSet = useMemo(() => new Set(setlistSongIds), [setlistSongIds]);

  return (
    <Panel>
      <PanelHeader>Repertoire</PanelHeader>
      <SearchInput
        type="text"
        placeholder="Search songs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <SongList>
        {filteredSongs.map((song) => (
          <RepertoireSongRow
            key={song.id}
            song={song}
            onAdd={onAddSong}
            inSetlist={setlistSongIdSet.has(song.id)}
          />
        ))}
        {filteredSongs.length === 0 && (
          <EmptyState>No songs found</EmptyState>
        )}
      </SongList>
    </Panel>
  );
}

const Panel = styled.div`
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.md};
`;

const PanelHeader = styled.h2`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SearchInput = styled.input`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const SongList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const EmptyState = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: 0.85rem;
`;
