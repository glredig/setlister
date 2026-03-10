# Frontend Phase B: Two-Panel Editor with Drag-and-Drop

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use frontend-dev-loop skill for visual verification with agent-browser. MANDATORY: Record webm demos for every new user-facing flow.

**Goal:** Build the two-panel setlist editor page — repertoire search on the left, draggable setlist on the right — with add, remove, reorder, and save.

**Architecture:** Editor page at `/setlists/[id]/edit` with a split layout. Left panel shows the band's repertoire with search filtering. Right panel shows the setlist with dnd-kit drag-and-drop reordering. Song cards are collapsed (one-line) — performance config editing is Phase C. All changes are held in React state and saved via a single bulk update API call.

**Tech Stack:** Next.js (Pages Router), styled-components, dnd-kit, TypeScript, Jest, React Testing Library

**API Base URL (dev):** `http://localhost:3001`

**Prerequisite:** Rails backend running on port 3001 with seed data (`cd backend && rails db:seed && rails server -p 3001`)

**Key conventions:**
- No barrel files — import directly from source files
- Theme-driven styles — never hardcode colors/fonts/spacing
- Reuse components — extract shared patterns, prefer prop variants
- TDD — write failing test first, then implement

---

### Task 1: Install dnd-kit and Add Bulk Update API Method

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/__tests__/lib/api.test.ts`

**Step 1: Install dnd-kit**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Step 2: Write the failing test for bulkUpdateSongs**

Add to `frontend/__tests__/lib/api.test.ts`:

```ts
describe('api.setlistSongs', () => {
  it('bulkUpdate sends PUT with songs array', async () => {
    const updatedSetlist = {
      id: 1, name: 'Friday Set', date: '2026-03-20', notes: '',
      setlist_songs: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updatedSetlist),
    });

    const songs = [
      { song_id: 1, position: 1, performance_config: {} },
      { song_id: 2, position: 2, performance_config: {} },
    ];

    const result = await api.setlistSongs.bulkUpdate(1, songs);
    expect(result).toEqual(updatedSetlist);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/setlists/1/songs',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ songs }),
      })
    );
  });
});
```

**Step 3: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL — `api.setlistSongs` is undefined.

**Step 4: Implement the API method**

Add to `frontend/lib/api.ts` after the `songs` section:

```ts
  setlistSongs: {
    bulkUpdate: (setlistId: number, songs: Array<{
      song_id: number;
      position: number;
      performance_config: Record<string, unknown>;
    }>) =>
      request<import('./types').SetlistDetail>(`/api/setlists/${setlistId}/songs`, {
        method: 'PUT',
        body: JSON.stringify({ songs }),
      }),
  },
```

**Step 5: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 6: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: install dnd-kit and add bulkUpdate API method"
```

---

### Task 2: Editor Page Route and Two-Panel Layout

**Files:**
- Create: `frontend/pages/setlists/[id]/edit.tsx`
- Create: `frontend/components/Editor/EditorLayout.tsx`
- Create: `frontend/__tests__/components/EditorLayout.test.tsx`

**Step 1: Write the failing test**

Create `frontend/__tests__/components/EditorLayout.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { EditorLayout } from '@/components/Editor/EditorLayout';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockSetlistDetail = {
  id: 1,
  name: 'Friday Night Set',
  date: '2026-03-20',
  notes: '',
  setlist_songs: [
    {
      id: 10,
      position: 1,
      song: { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
      song_performance_config: { id: 100, lead_vocalist_id: null, backup_vocalist_ids: [], guitar_solo_id: null, instrument_overrides: {}, free_text_notes: '' },
    },
  ],
};

const mockSongs = [
  { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
  { id: 2, title: 'Song B', artist: 'Artist B', tempo: 140, key: 'G', time_signature: '4/4', duration: 200 },
  { id: 3, title: 'Song C', artist: 'Artist C', tempo: 100, key: 'Am', time_signature: '3/4', duration: 180 },
];

describe('EditorLayout', () => {
  beforeEach(() => {
    mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
    mockedApi.songs.list.mockResolvedValue(mockSongs);
  });

  it('renders both panels with setlist name', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
    });
    // Repertoire panel shows available songs
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL — module not found.

**Step 3: Implement EditorLayout**

Create `frontend/components/Editor/EditorLayout.tsx`:

```tsx
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '@/lib/api';
import { SetlistDetail, Song } from '@/lib/types';

interface EditorLayoutProps {
  setlistId: number;
  bandId: number;
}

export function EditorLayout({ setlistId, bandId }: EditorLayoutProps) {
  const [setlist, setSetlist] = useState<SetlistDetail | null>(null);
  const [repertoire, setRepertoire] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.setlists.get(setlistId),
      api.songs.list(bandId),
    ]).then(([setlistData, songsData]) => {
      setSetlist(setlistData);
      setRepertoire(songsData);
    }).finally(() => setLoading(false));
  }, [setlistId, bandId]);

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
        <LeftPanel>
          <PanelHeader>Repertoire</PanelHeader>
          <SearchInput type="text" placeholder="Search songs..." />
          <p>Repertoire panel — {repertoire.length} songs available</p>
        </LeftPanel>
        <RightPanel>
          <PanelHeader>Setlist</PanelHeader>
          <p>Setlist panel — {setlist.setlist_songs.length} songs</p>
        </RightPanel>
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

const LeftPanel = styled.div`
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
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
```

**Step 4: Create the page route**

Create `frontend/pages/setlists/[id]/edit.tsx`:

```tsx
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
```

**Step 5: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 6: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add editor page with two-panel layout"
```

---

### Task 3: Repertoire Panel with Search

**Files:**
- Create: `frontend/components/Editor/RepertoirePanel.tsx`
- Create: `frontend/components/Editor/RepertoireSongRow.tsx`
- Create: `frontend/__tests__/components/RepertoirePanel.test.tsx`
- Modify: `frontend/components/Editor/EditorLayout.tsx`

**Step 1: Write the failing test**

Create `frontend/__tests__/components/RepertoirePanel.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { RepertoirePanel } from '@/components/Editor/RepertoirePanel';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockSongs = [
  { id: 1, title: 'Bohemian Rhapsody', artist: 'Queen', tempo: 72, key: 'Bb', time_signature: '4/4', duration: 355 },
  { id: 2, title: 'Stairway to Heaven', artist: 'Led Zeppelin', tempo: 82, key: 'Am', time_signature: '4/4', duration: 482 },
  { id: 3, title: 'Back in Black', artist: 'AC/DC', tempo: 96, key: 'E', time_signature: '4/4', duration: 255 },
];

describe('RepertoirePanel', () => {
  it('renders all songs', () => {
    renderWithTheme(<RepertoirePanel songs={mockSongs} onAddSong={jest.fn()} setlistSongIds={[]} />);

    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Stairway to Heaven')).toBeInTheDocument();
    expect(screen.getByText('Back in Black')).toBeInTheDocument();
  });

  it('filters songs by search query', () => {
    renderWithTheme(<RepertoirePanel songs={mockSongs} onAddSong={jest.fn()} setlistSongIds={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'bohemian' } });

    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.queryByText('Stairway to Heaven')).not.toBeInTheDocument();
    expect(screen.queryByText('Back in Black')).not.toBeInTheDocument();
  });

  it('calls onAddSong when add button is clicked', () => {
    const onAddSong = jest.fn();
    renderWithTheme(<RepertoirePanel songs={mockSongs} onAddSong={onAddSong} setlistSongIds={[]} />);

    fireEvent.click(screen.getAllByRole('button', { name: /add/i })[0]);

    expect(onAddSong).toHaveBeenCalledWith(mockSongs[0]);
  });

  it('dims songs already in setlist', () => {
    renderWithTheme(<RepertoirePanel songs={mockSongs} onAddSong={jest.fn()} setlistSongIds={[1]} />);

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    // First song (id=1) is in setlist, its add button should be disabled
    expect(addButtons[0]).toBeDisabled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL — module not found.

**Step 3: Implement RepertoireSongRow**

Create `frontend/components/Editor/RepertoireSongRow.tsx`:

```tsx
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
```

**Step 4: Implement RepertoirePanel**

Create `frontend/components/Editor/RepertoirePanel.tsx`:

```tsx
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
```

**Step 5: Wire RepertoirePanel into EditorLayout**

Modify `frontend/components/Editor/EditorLayout.tsx`:

Replace the `<LeftPanel>` placeholder block with:

```tsx
import { RepertoirePanel } from '@/components/Editor/RepertoirePanel';
```

Replace the LeftPanel JSX:
```tsx
<RepertoirePanel
  songs={repertoire}
  onAddSong={handleAddSong}
  setlistSongIds={setlistSongs.map((ss) => ss.song.id)}
/>
```

Add state and handler to the component:
```tsx
const [setlistSongs, setSetlistSongs] = useState(setlist.setlist_songs);

const handleAddSong = (song: Song) => {
  const newSetlistSong = {
    id: Date.now(), // temporary ID for new items
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
```

Note: The `setlistSongs` state needs to be initialized after setlist loads. Move the useState initialization inside a useEffect or use a lazy initializer that updates when setlist changes. The simplest approach: derive `setlistSongs` from `setlist` on initial load using a separate `useEffect`:

```tsx
const [setlistSongs, setSetlistSongs] = useState<SetlistSong[]>([]);

useEffect(() => {
  if (setlist) {
    setSetlistSongs(setlist.setlist_songs);
  }
}, [setlist]);
```

Remove the `LeftPanel`, `PanelHeader`, and `SearchInput` styled components from EditorLayout (they now live in RepertoirePanel). Keep the `Panels` wrapper.

**Step 6: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 7: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add repertoire panel with search and add-to-setlist"
```

---

### Task 4: Setlist Panel with Drag-and-Drop Reordering

**Files:**
- Create: `frontend/components/Editor/SetlistPanel.tsx`
- Create: `frontend/components/Editor/SortableSetlistItem.tsx`
- Create: `frontend/__tests__/components/SetlistPanel.test.tsx`
- Modify: `frontend/components/Editor/EditorLayout.tsx`

**Step 1: Write the failing test**

Create `frontend/__tests__/components/SetlistPanel.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { SetlistPanel } from '@/components/Editor/SetlistPanel';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockSetlistSongs = [
  {
    id: 10,
    position: 1,
    song: { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
    song_performance_config: { id: 100, lead_vocalist_id: null, backup_vocalist_ids: [], guitar_solo_id: null, instrument_overrides: {}, free_text_notes: '' },
  },
  {
    id: 11,
    position: 2,
    song: { id: 2, title: 'Song B', artist: 'Artist B', tempo: 140, key: 'G', time_signature: '4/4', duration: 200 },
    song_performance_config: { id: 101, lead_vocalist_id: null, backup_vocalist_ids: [], guitar_solo_id: null, instrument_overrides: {}, free_text_notes: '' },
  },
];

describe('SetlistPanel', () => {
  it('renders songs in order', () => {
    renderWithTheme(
      <SetlistPanel
        setlistSongs={mockSetlistSongs}
        onReorder={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    expect(screen.getByText('Song A')).toBeInTheDocument();
    expect(screen.getByText('Song B')).toBeInTheDocument();
  });

  it('shows empty state when no songs', () => {
    renderWithTheme(
      <SetlistPanel
        setlistSongs={[]}
        onReorder={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    expect(screen.getByText(/add songs/i)).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();
    renderWithTheme(
      <SetlistPanel
        setlistSongs={mockSetlistSongs}
        onReorder={jest.fn()}
        onRemove={onRemove}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /remove/i })[0]);

    expect(onRemove).toHaveBeenCalledWith(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL — module not found.

**Step 3: Implement SortableSetlistItem**

Create `frontend/components/Editor/SortableSetlistItem.tsx`:

```tsx
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
```

**Step 4: Implement SetlistPanel**

Create `frontend/components/Editor/SetlistPanel.tsx`:

```tsx
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
import { SetlistSong } from '@/lib/types';
import { SortableSetlistItem } from '@/components/Editor/SortableSetlistItem';

interface SetlistPanelProps {
  setlistSongs: SetlistSong[];
  onReorder: (activeId: number, overId: number) => void;
  onRemove: (setlistSongId: number) => void;
}

export function SetlistPanel({ setlistSongs, onReorder, onRemove }: SetlistPanelProps) {
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
```

**Step 5: Wire SetlistPanel into EditorLayout**

Modify `frontend/components/Editor/EditorLayout.tsx`:

Add imports:
```tsx
import { SetlistPanel } from '@/components/Editor/SetlistPanel';
import { SetlistSong } from '@/lib/types';
import { arrayMove } from '@dnd-kit/sortable';
```

Add handlers:
```tsx
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
```

Replace the RightPanel placeholder with:
```tsx
<SetlistPanel
  setlistSongs={setlistSongs}
  onReorder={handleReorder}
  onRemove={handleRemoveSong}
/>
```

Remove the `RightPanel` and `PanelHeader` styled components from EditorLayout (they now live in SetlistPanel). Keep the `Panels` wrapper.

**Step 6: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 7: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add setlist panel with dnd-kit drag-and-drop reordering"
```

---

### Task 5: Save and Cancel with Bulk Update

**Files:**
- Create: `frontend/__tests__/components/EditorSave.test.tsx`
- Modify: `frontend/components/Editor/EditorLayout.tsx`

**Step 1: Write the failing test**

Create `frontend/__tests__/components/EditorSave.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { EditorLayout } from '@/components/Editor/EditorLayout';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: { id: '1' } }),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockSetlistDetail = {
  id: 1,
  name: 'Friday Night Set',
  date: '2026-03-20',
  notes: '',
  setlist_songs: [
    {
      id: 10,
      position: 1,
      song: { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
      song_performance_config: { id: 100, lead_vocalist_id: null, backup_vocalist_ids: [], guitar_solo_id: null, instrument_overrides: {}, free_text_notes: '' },
    },
  ],
};

const mockSongs = [
  { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
  { id: 2, title: 'Song B', artist: 'Artist B', tempo: 140, key: 'G', time_signature: '4/4', duration: 200 },
];

describe('Editor save/cancel', () => {
  beforeEach(() => {
    mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
    mockedApi.songs.list.mockResolvedValue(mockSongs);
  });

  it('calls bulkUpdate on save', async () => {
    mockedApi.setlistSongs.bulkUpdate.mockResolvedValue(mockSetlistDetail);

    renderWithTheme(<EditorLayout setlistId={1} bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockedApi.setlistSongs.bulkUpdate).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({ song_id: 1, position: 1 }),
        ])
      );
    });
  });

  it('shows save button disabled when no changes', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL

**Step 3: Add save/cancel to EditorLayout**

Modify `frontend/components/Editor/EditorLayout.tsx`:

Add dirty tracking state:
```tsx
const [isDirty, setIsDirty] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

Wrap existing handlers to set dirty:
```tsx
const handleAddSong = (song: Song) => {
  // ...existing code...
  setIsDirty(true);
};

const handleReorder = (activeId: number, overId: number) => {
  // ...existing code...
  setIsDirty(true);
};

const handleRemoveSong = (setlistSongId: number) => {
  // ...existing code...
  setIsDirty(true);
};
```

Add save handler:
```tsx
const handleSave = async () => {
  setIsSaving(true);
  try {
    const songs = setlistSongs.map((ss, index) => ({
      song_id: ss.song.id,
      position: index + 1,
      performance_config: {
        lead_vocalist_id: ss.song_performance_config.lead_vocalist_id,
        backup_vocalist_ids: ss.song_performance_config.backup_vocalist_ids,
        guitar_solo_id: ss.song_performance_config.guitar_solo_id,
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
  setSetlistSongs(setlist.setlist_songs);
  setIsDirty(false);
};
```

Add buttons to the Header:
```tsx
<HeaderActions>
  <BackLink href="/">← Back</BackLink>
  <CancelButton onClick={handleCancel} disabled={!isDirty}>
    Cancel
  </CancelButton>
  <SaveButton onClick={handleSave} disabled={!isDirty || isSaving} aria-label="Save">
    {isSaving ? 'Saving...' : 'Save'}
  </SaveButton>
</HeaderActions>
```

Add styled buttons:
```tsx
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
```

**Step 4: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 5: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add save/cancel with bulk update API call"
```

---

### Task 6: Full Integration Verification and Recordings

**Step 1: Run full test suite**

```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose
```

Expected: ALL PASS

**Step 2: Start both servers and verify end-to-end**

```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend && rails server -p 3001 &
cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm run dev &
```

**Step 3: Verify dashboard navigation to editor**

```bash
agent-browser open http://localhost:3000 && agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser click "text=Friday Night Set"
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot docs/screenshots/editor-two-panel.png
```

Expected: Two-panel layout with repertoire on left, setlist on right, setlist name in header, Save/Cancel buttons.

**Step 4: Test add song from repertoire**

```bash
agent-browser snapshot -i
# Click add button for a song not yet in setlist
agent-browser click "[aria-label*='Add']"
agent-browser screenshot docs/screenshots/editor-after-add.png
```

Expected: Song appears in the setlist panel. Save button becomes enabled.

**Step 5: Test save**

```bash
agent-browser click "[aria-label='Save']"
agent-browser wait --load networkidle
agent-browser screenshot docs/screenshots/editor-after-save.png
```

Expected: Save completes, button becomes disabled again.

**Step 6: Record webm flow demos**

Create and run flow scripts for:

1. `frontend/scripts/flows/editor-add-song.ts` — Navigate to editor, add a song from repertoire, save
2. `frontend/scripts/flows/editor-reorder.ts` — Navigate to editor with multiple songs, drag to reorder, save
3. `frontend/scripts/flows/editor-remove-song.ts` — Navigate to editor, remove a song, save

```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend
npm run record-flow scripts/flows/editor-add-song.ts
npm run record-flow scripts/flows/editor-reorder.ts
npm run record-flow scripts/flows/editor-remove-song.ts
```

**Step 7: Clean up**

```bash
agent-browser close
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:3001) 2>/dev/null
```

**Step 8: Commit screenshots and recordings**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add docs/screenshots/ docs/recordings/ frontend/scripts/flows/
git commit -m "docs: add editor screenshots and flow recordings"
```

Phase B frontend is complete. The two-panel editor supports searching the repertoire, adding songs, drag-and-drop reordering, removing songs, and saving via bulk update.
