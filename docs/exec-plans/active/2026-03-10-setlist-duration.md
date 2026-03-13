# Setlist Duration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add setlist duration tracking with adjustable inter-song gap time to the editor.

**Architecture:** Add `inter_song_gap_seconds` column to `setlists` table. Frontend computes total duration client-side from song durations and gap setting. A duration summary bar in the setlist panel updates in real-time. Gap is persisted via the existing setlist update endpoint.

**Tech Stack:** Rails 7, PostgreSQL, Next.js, styled-components, Jest, RSpec

---

### Task 1: Backend Migration & Model

Add `inter_song_gap_seconds` to the setlists table and expose it through the API.

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_add_inter_song_gap_to_setlists.rb`
- Modify: `backend/app/models/setlist.rb`
- Modify: `backend/app/controllers/api/setlists_controller.rb`
- Modify: `backend/spec/requests/setlists_spec.rb`
- Modify: `backend/spec/factories/setlists.rb`

**Step 1: Write the failing test**

Add to `backend/spec/requests/setlists_spec.rb`, inside the `describe "GET /api/setlists/:id"` block, after the existing test:

```ruby
it "returns inter_song_gap_seconds in the response" do
  setlist = create(:setlist, band: band, inter_song_gap_seconds: 45)

  get "/api/setlists/#{setlist.id}"

  expect(response).to have_http_status(:ok)
  json = JSON.parse(response.body)
  expect(json["inter_song_gap_seconds"]).to eq(45)
end
```

Also add to the `describe "PUT /api/setlists/:id"` block, after the existing test:

```ruby
it "updates inter_song_gap_seconds" do
  setlist = create(:setlist, band: band)

  put "/api/setlists/#{setlist.id}", params: { setlist: { inter_song_gap_seconds: 60 } }

  expect(response).to have_http_status(:ok)
  expect(setlist.reload.inter_song_gap_seconds).to eq(60)
end
```

Also add to the `describe "POST /api/bands/:band_id/setlists"` block, after the existing test:

```ruby
it "defaults inter_song_gap_seconds to 30" do
  post "/api/bands/#{band.id}/setlists", params: {
    setlist: { name: "Gap Test", date: "2026-03-15" }
  }

  expect(response).to have_http_status(:created)
  json = JSON.parse(response.body)
  expect(json["inter_song_gap_seconds"]).to eq(30)
end
```

**Step 2: Run tests to verify they fail**

Run: `cd backend && bundle exec rspec spec/requests/setlists_spec.rb -v`
Expected: 3 failures — `inter_song_gap_seconds` column does not exist.

**Step 3: Generate migration**

Run:
```bash
cd backend && rails generate migration AddInterSongGapToSetlists inter_song_gap_seconds:integer
```

Then edit the generated migration file to add the default:

```ruby
class AddInterSongGapToSetlists < ActiveRecord::Migration[7.1]
  def change
    add_column :setlists, :inter_song_gap_seconds, :integer, default: 30, null: false
  end
end
```

Run: `cd backend && rails db:migrate`

**Step 4: Update the model serializer**

In `backend/app/models/setlist.rb`, update `as_detailed_json` to include `inter_song_gap_seconds`:

```ruby
def as_detailed_json
  as_json(
    only: [:id, :name, :date, :notes, :inter_song_gap_seconds],
    include: {
      setlist_songs: {
        only: [:id, :position],
        include: {
          song: { only: [:id, :title, :artist, :tempo, :key, :time_signature, :duration] },
          song_performance_config: {
            only: [:id, :lead_vocalist_ids, :backup_vocalist_ids, :solos,
                   :instrument_overrides, :free_text_notes]
          }
        }
      }
    }
  )
end
```

**Step 5: Update the controller to permit the new param**

In `backend/app/controllers/api/setlists_controller.rb`, update `setlist_params`:

```ruby
def setlist_params
  params.require(:setlist).permit(:name, :date, :notes, :inter_song_gap_seconds)
end
```

**Step 6: Update the factory**

In `backend/spec/factories/setlists.rb`:

```ruby
FactoryBot.define do
  factory :setlist do
    name { "Friday Night Set" }
    date { Date.today }
    notes { "" }
    inter_song_gap_seconds { 30 }
    band
  end
end
```

**Step 7: Run tests to verify they pass**

Run: `cd backend && bundle exec rspec spec/requests/setlists_spec.rb -v`
Expected: All pass.

Run: `cd backend && bundle exec rspec`
Expected: All 66+ tests pass, 0 failures.

**Step 8: Update the index endpoint to include inter_song_gap_seconds**

The `index` action currently uses `as_json(only: [:id, :name, :date, :notes])`. Update it to include `inter_song_gap_seconds`:

In `backend/app/controllers/api/setlists_controller.rb`:

```ruby
def index
  setlists = Band.find(params[:band_id]).setlists.order(date: :desc)
  render json: setlists.as_json(only: [:id, :name, :date, :notes, :inter_song_gap_seconds])
end
```

**Step 9: Run all backend tests**

Run: `cd backend && bundle exec rspec`
Expected: All pass.

**Step 10: Commit**

```bash
cd backend && git add -A && git commit -m "feat: add inter_song_gap_seconds to setlists"
```

---

### Task 2: Frontend Types & API

Update TypeScript types and API client to handle `inter_song_gap_seconds`.

**Files:**
- Modify: `frontend/lib/types.ts`
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/__tests__/lib/api.test.ts`

**Step 1: Write the failing test**

Add to `frontend/__tests__/lib/api.test.ts`, inside the `describe('setlists')` block. Find the existing `create` test and add after it:

```typescript
it('creates a setlist with inter_song_gap_seconds', async () => {
  const mockSetlist = { id: 1, name: 'Test', date: '2026-03-15', notes: '', inter_song_gap_seconds: 45 };
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(mockSetlist),
  });

  const result = await api.setlists.create(1, { name: 'Test', date: '2026-03-15', inter_song_gap_seconds: 45 });

  expect(result.inter_song_gap_seconds).toBe(45);
  const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
  const body = JSON.parse(fetchCall[1].body);
  expect(body.setlist.inter_song_gap_seconds).toBe(45);
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern=api.test -v`
Expected: FAIL — `inter_song_gap_seconds` not in create params type.

**Step 3: Update types**

In `frontend/lib/types.ts`, update the `Setlist` interface:

```typescript
export interface Setlist {
  id: number;
  name: string;
  date: string;
  notes: string;
  inter_song_gap_seconds: number;
}
```

**Step 4: Update API client**

In `frontend/lib/api.ts`, update the `create` method signature to accept `inter_song_gap_seconds`:

```typescript
create: (bandId: number, data: { name: string; date: string; notes?: string; inter_song_gap_seconds?: number }) =>
  request<import('./types').Setlist>(`/api/bands/${bandId}/setlists`, {
    method: 'POST',
    body: JSON.stringify({ setlist: data }),
  }),
```

Update the `update` method signature:

```typescript
update: (id: number, data: Partial<{ name: string; date: string; notes: string; inter_song_gap_seconds: number }>) =>
  request<import('./types').Setlist>(`/api/setlists/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ setlist: data }),
  }),
```

**Step 5: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern=api.test -v`
Expected: All pass.

**Step 6: Update test fixtures across the codebase**

Any existing test that creates mock `Setlist` or `SetlistDetail` objects needs `inter_song_gap_seconds`. Check and update:

- `frontend/__tests__/components/EditorLayout.test.tsx` — `mockSetlistDetail` needs `inter_song_gap_seconds: 30`
- `frontend/__tests__/components/EditorExpand.test.tsx` — mock setlist detail needs `inter_song_gap_seconds: 30`
- `frontend/__tests__/components/EditorSave.test.tsx` — mock setlist detail needs `inter_song_gap_seconds: 30`
- Any other test files with mock Setlist objects

Add `inter_song_gap_seconds: 30` to each mock's top-level fields (alongside `id`, `name`, `date`, `notes`).

**Step 7: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All 40+ tests pass.

**Step 8: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add inter_song_gap_seconds to frontend types and API"
```

---

### Task 3: Duration Summary Bar Component

Create a `DurationSummary` component that displays total setlist duration and an adjustable gap input.

**Files:**
- Create: `frontend/components/Editor/DurationSummary.tsx`
- Create: `frontend/__tests__/components/DurationSummary.test.tsx`

**Step 1: Write the failing tests**

Create `frontend/__tests__/components/DurationSummary.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { DurationSummary } from '@/components/Editor/DurationSummary';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('DurationSummary', () => {
  it('displays total duration formatted as hours and minutes', () => {
    // 2 songs: 300s + 240s = 540s songs, 1 gap × 30s = 30s, total = 570s = 9m 30s
    renderWithTheme(
      <DurationSummary
        songDurations={[300, 240]}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );

    expect(screen.getByText('9m 30s')).toBeInTheDocument();
  });

  it('displays duration in hours when over 60 minutes', () => {
    // 10 songs of 420s each = 4200s, 9 gaps × 30s = 270s, total = 4470s = 1h 14m
    const durations = Array(10).fill(420);
    renderWithTheme(
      <DurationSummary
        songDurations={durations}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );

    expect(screen.getByText('1h 14m')).toBeInTheDocument();
  });

  it('shows 0m when no songs', () => {
    renderWithTheme(
      <DurationSummary
        songDurations={[]}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );

    expect(screen.getByText('0m')).toBeInTheDocument();
  });

  it('renders the gap input with current value', () => {
    renderWithTheme(
      <DurationSummary
        songDurations={[300]}
        gapSeconds={45}
        onGapChange={jest.fn()}
      />
    );

    const input = screen.getByLabelText('Time between songs (seconds)');
    expect(input).toHaveValue(45);
  });

  it('calls onGapChange when gap input changes', () => {
    const onGapChange = jest.fn();
    renderWithTheme(
      <DurationSummary
        songDurations={[300]}
        gapSeconds={30}
        onGapChange={onGapChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Time between songs (seconds)'), {
      target: { value: '60' },
    });

    expect(onGapChange).toHaveBeenCalledWith(60);
  });

  it('treats empty gap input as 0', () => {
    const onGapChange = jest.fn();
    renderWithTheme(
      <DurationSummary
        songDurations={[300]}
        gapSeconds={30}
        onGapChange={onGapChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Time between songs (seconds)'), {
      target: { value: '' },
    });

    expect(onGapChange).toHaveBeenCalledWith(0);
  });

  it('does not count gaps when there is only one song', () => {
    // 1 song of 300s, 0 gaps, total = 300s = 5m
    renderWithTheme(
      <DurationSummary
        songDurations={[300]}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );

    expect(screen.getByText('5m')).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPattern=DurationSummary -v`
Expected: FAIL — module not found.

**Step 3: Implement DurationSummary component**

Create `frontend/components/Editor/DurationSummary.tsx`:

```typescript
import styled from 'styled-components';

interface DurationSummaryProps {
  songDurations: number[];
  gapSeconds: number;
  onGapChange: (gap: number) => void;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (seconds > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${minutes}m`;
}

export function DurationSummary({ songDurations, gapSeconds, onGapChange }: DurationSummaryProps) {
  const songTotal = songDurations.reduce((sum, d) => sum + d, 0);
  const gapCount = Math.max(0, songDurations.length - 1);
  const totalSeconds = songTotal + gapCount * gapSeconds;

  return (
    <Container>
      <DurationDisplay>
        <DurationLabel>Duration</DurationLabel>
        <DurationValue>{formatDuration(totalSeconds)}</DurationValue>
      </DurationDisplay>
      <GapControl>
        <GapLabel htmlFor="gap-input">Time between songs (seconds)</GapLabel>
        <GapInput
          id="gap-input"
          type="number"
          min={0}
          value={gapSeconds}
          onChange={(e) => onGapChange(e.target.value === '' ? 0 : Number(e.target.value))}
          aria-label="Time between songs (seconds)"
        />
      </GapControl>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const DurationDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const DurationLabel = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DurationValue = styled.span`
  font-size: 1rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
`;

const GapControl = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const GapLabel = styled.label`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const GapInput = styled.input`
  width: 60px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  text-align: center;
`;
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern=DurationSummary -v`
Expected: All 7 tests pass.

**Step 5: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add DurationSummary component with gap control"
```

---

### Task 4: Integrate Duration Summary into Editor

Wire `DurationSummary` into `SetlistPanel` and connect gap state management in `EditorLayout`.

**Files:**
- Modify: `frontend/components/Editor/EditorLayout.tsx`
- Modify: `frontend/components/Editor/SetlistPanel.tsx`
- Modify: `frontend/__tests__/components/EditorLayout.test.tsx`
- Modify: `frontend/__tests__/components/SetlistPanel.test.tsx`

**Step 1: Write the failing tests**

Add to `frontend/__tests__/components/EditorLayout.test.tsx`, inside the `describe('EditorLayout')` block:

```typescript
it('displays the duration summary bar', async () => {
  renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={[]} />);

  await waitFor(() => {
    expect(screen.getByText('Duration')).toBeInTheDocument();
  });
});
```

Add to `frontend/__tests__/components/SetlistPanel.test.tsx`, inside the `describe('SetlistPanel')` block:

```typescript
it('renders the duration summary bar', () => {
  renderWithTheme(
    <SetlistPanel
      setlistSongs={mockSetlistSongs}
      onReorder={jest.fn()}
      onRemove={jest.fn()}
      expandedId={null}
      onToggleExpand={jest.fn()}
      onConfigChange={jest.fn()}
      members={[]}
      gapSeconds={30}
      onGapChange={jest.fn()}
    />
  );

  expect(screen.getByText('Duration')).toBeInTheDocument();
  expect(screen.getByLabelText('Time between songs (seconds)')).toHaveValue(30);
});
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPattern="(EditorLayout|SetlistPanel)" -v`
Expected: FAIL — new props not accepted, Duration text not found.

**Step 3: Update SetlistPanel to accept gap props and render DurationSummary**

In `frontend/components/Editor/SetlistPanel.tsx`:

Add import at top:
```typescript
import { DurationSummary } from '@/components/Editor/DurationSummary';
```

Update the interface:
```typescript
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
}
```

Update the function signature:
```typescript
export function SetlistPanel({ setlistSongs, onReorder, onRemove, expandedId, onToggleExpand, onConfigChange, members, gapSeconds, onGapChange }: SetlistPanelProps) {
```

Add DurationSummary right after the `<PanelHeader>Setlist</PanelHeader>` line:
```typescript
<DurationSummary
  songDurations={setlistSongs.map((ss) => ss.song.duration)}
  gapSeconds={gapSeconds}
  onGapChange={onGapChange}
/>
```

**Step 4: Update EditorLayout to manage gap state and pass it down**

In `frontend/components/Editor/EditorLayout.tsx`:

Add a new state variable after the existing state declarations:
```typescript
const [gapSeconds, setGapSeconds] = useState<number>(30);
```

Update the `useEffect` to set `gapSeconds` from the loaded setlist:
```typescript
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
```

Add a gap change handler after `handleConfigChange`:
```typescript
const handleGapChange = (gap: number) => {
  setGapSeconds(gap);
  setIsDirty(true);
};
```

Update `handleSave` to persist the gap. Add before the `const songs = ...` line:
```typescript
await api.setlists.update(setlist.id, { inter_song_gap_seconds: gapSeconds });
```

Update `handleCancel` to restore the gap:
```typescript
const handleCancel = () => {
  if (!setlist) return;
  setSetlistSongs(setlist.setlist_songs);
  setGapSeconds(setlist.inter_song_gap_seconds);
  setIsDirty(false);
};
```

Pass the new props to `SetlistPanel`:
```typescript
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
/>
```

**Step 5: Update existing SetlistPanel tests to pass new required props**

In `frontend/__tests__/components/SetlistPanel.test.tsx`, add `gapSeconds={30}` and `onGapChange={jest.fn()}` to every existing `<SetlistPanel>` render call.

**Step 6: Update EditorLayout test mock to include inter_song_gap_seconds**

In `frontend/__tests__/components/EditorLayout.test.tsx`, ensure `mockSetlistDetail` has `inter_song_gap_seconds: 30` (should already be done in Task 2).

**Step 7: Run tests to verify they pass**

Run: `cd frontend && npm test -v`
Expected: All tests pass.

**Step 8: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: integrate duration summary into setlist editor"
```

---

### Task 5: Update Seeds & Integration Verification

Update seed data and verify end-to-end.

**Files:**
- Modify: `backend/db/seeds.rb`

**Step 1: Update seeds to include inter_song_gap_seconds**

In `backend/db/seeds.rb`, update the setlist creation line:

```ruby
setlist = band.setlists.create!(name: "Friday Night Set", date: Date.new(2026, 3, 20), notes: "Opening night of spring tour", inter_song_gap_seconds: 30)
```

**Step 2: Re-seed the database**

Run: `cd backend && rails db:seed:replant`

**Step 3: Run all backend tests**

Run: `cd backend && bundle exec rspec`
Expected: All pass.

**Step 4: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All pass.

**Step 5: Visual verification**

Use the frontend-dev-loop skill to:
1. Start backend: `cd backend && rails server -p 3001 &`
2. Start frontend: `cd frontend && NEXT_PUBLIC_BAND_ID=<band_id> npm run dev &`
3. Navigate to the editor for the seeded setlist
4. Verify the duration summary bar appears showing total time
5. Verify the gap input shows 30
6. Change the gap value and confirm the total updates
7. Add/remove a song and confirm the total updates
8. Take a screenshot to `docs/screenshots/duration-summary.png`

**Step 6: Record a flow demo**

Create `frontend/scripts/flows/editor-duration.ts`:

```typescript
import { recordFlow, FlowFn } from '../record-flow';

const flow: FlowFn = async (page) => {
  // Navigate from dashboard to editor
  await page.waitForSelector('a[href*="/setlists/"]');
  await page.waitForTimeout(300);
  await page.click('a[href*="/edit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Show duration summary bar (it should be visible)
  await page.waitForTimeout(500);

  // Change gap time
  const gapInput = page.locator('[aria-label="Time between songs (seconds)"]');
  await gapInput.click();
  await gapInput.fill('60');
  await page.waitForTimeout(500);

  // Change back
  await gapInput.fill('15');
  await page.waitForTimeout(500);

  // Save
  await page.click('button[aria-label="Save"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
};

export default async function run(record: typeof recordFlow) {
  await record(flow, {
    outputPath: '../docs/recordings/editor-duration.webm',
    url: 'http://localhost:3000',
  });
}
```

Run: `cd frontend && npm run record-flow scripts/flows/editor-duration.ts`

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: update seeds and add duration integration verification"
```

---

## Summary

| Task | What | Backend | Frontend |
|------|------|---------|----------|
| 1 | Migration + API | ✓ | |
| 2 | Types + API client | | ✓ |
| 3 | DurationSummary component | | ✓ |
| 4 | Wire into editor | | ✓ |
| 5 | Seeds + integration | ✓ | ✓ |
