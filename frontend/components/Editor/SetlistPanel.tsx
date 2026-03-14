import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import styled from 'styled-components';
import { SetlistSong, Member, SongPerformanceConfig } from '@/lib/types';
import { SortableSetlistItem } from '@/components/Editor/SortableSetlistItem';
import { DurationSummary } from '@/components/Editor/DurationSummary';

interface SetlistPanelProps {
  setlistSongs: SetlistSong[];
  onReorder: (activeId: number, overId: number) => void;
  onRemove: (setlistSongId: number) => void;
  expandedId: number | null;
  onToggleExpand: (id: number) => void;
  onConfigChange: (setlistSongId: number, config: SongPerformanceConfig) => void;
  members: Member[];
  gapSeconds: number;
  onGapChange: (gap: number) => void;
  memberNotes: Record<number, string>;
  currentMemberId: number | null;
}

export function SetlistPanel({ setlistSongs, onReorder, onRemove, expandedId, onToggleExpand, onConfigChange, members, gapSeconds, onGapChange, memberNotes, currentMemberId }: SetlistPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(Number(active.id), Number(over.id));
    }
  };

  return (
    <Panel>
      <PanelHeader>Setlist</PanelHeader>
      <DurationSummary
        songDurations={setlistSongs.map((ss) => ss.song.duration)}
        gapSeconds={gapSeconds}
        onGapChange={onGapChange}
      />
      {setlistSongs.length === 0 ? (
        <EmptyState>Add songs from the repertoire to get started</EmptyState>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={setlistSongs.map((ss) => ss.id)} strategy={verticalListSortingStrategy}>
            <SongList>
              {setlistSongs.map((ss, index) => (
                <SortableSetlistItem
                  key={ss.id}
                  setlistSong={ss}
                  index={index}
                  onRemove={onRemove}
                  expanded={expandedId === ss.id}
                  onToggleExpand={onToggleExpand}
                  onConfigChange={onConfigChange}
                  members={members}
                  mode="edit"
                  memberNote={memberNotes[ss.id] ?? ''}
                  currentMemberId={currentMemberId}
                />
              ))}
            </SongList>
          </SortableContext>
        </DndContext>
      )}
    </Panel>
  );
}

const Panel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
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
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SongList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const EmptyState = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xl};
  font-size: 0.85rem;
`;
