import styled from 'styled-components';
import { Song } from '@/lib/types';

interface RepertoireSongRowProps {
  song: Song;
  onAdd: (song: Song) => void;
  inSetlist: boolean;
}

export function RepertoireSongRow({ song, onAdd, inSetlist }: RepertoireSongRowProps) {
  return (
    <Row $dimmed={inSetlist}>
      <SongInfo>
        <SongTitle>{song.title}</SongTitle>
        <SongMeta>{song.artist} · {song.tempo} BPM · {song.key}</SongMeta>
      </SongInfo>
      <AddButton
        onClick={() => onAdd(song)}
        disabled={inSetlist}
        aria-label={`Add ${song.title}`}
      >
        +
      </AddButton>
    </Row>
  );
}

const Row = styled.div<{ $dimmed: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: 4px;
  opacity: ${({ $dimmed }) => ($dimmed ? 0.4 : 1)};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceLight};
  }
`;

const SongInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SongTitle = styled.div`
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SongMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const AddButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.text};
  width: 28px;
  height: 28px;
  font-size: 1rem;
  cursor: pointer;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }
`;
