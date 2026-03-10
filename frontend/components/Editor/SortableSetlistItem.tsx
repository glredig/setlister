import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styled from 'styled-components';
import { SetlistSong } from '@/lib/types';

interface SortableSetlistItemProps {
  setlistSong: SetlistSong;
  index: number;
  onRemove: (id: number) => void;
}

export function SortableSetlistItem({ setlistSong, index, onRemove }: SortableSetlistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setlistSong.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { song } = setlistSong;

  return (
    <Item ref={setNodeRef} style={style}>
      <DragHandle {...attributes} {...listeners} aria-label="Drag to reorder">
        ⠿
      </DragHandle>
      <Position>{index + 1}</Position>
      <SongInfo>
        <SongTitle>{song.title}</SongTitle>
        <SongMeta>{song.artist} · {song.tempo} BPM · {song.key}</SongMeta>
      </SongInfo>
      <RemoveButton
        onClick={() => onRemove(setlistSong.id)}
        aria-label={`Remove ${song.title}`}
      >
        ×
      </RemoveButton>
    </Item>
  );
}

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
`;

const DragHandle = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: grab;
  font-size: 1.1rem;
  padding: 0 4px;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
`;

const Position = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  width: 20px;
  text-align: center;
  flex-shrink: 0;
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

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.2rem;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
