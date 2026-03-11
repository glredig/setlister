# Frontend Phase C: Performance Config Editor

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use frontend-dev-loop skill for visual verification with agent-browser. MANDATORY: Record webm demos for every new user-facing flow.

**Goal:** Make setlist song cards expandable (accordion) to edit performance configs — lead vocalists, backup vocals, solos, instrument overrides, and notes — with auto-scroll to keep the next song visible.

**Architecture:** Schema migration renames `lead_vocalist_id` → `lead_vocalist_ids` (array) and replaces `guitar_solo_id` with `solos` (jsonb array of `{ member_id, instrument }`). Frontend adds `PerformanceConfigForm` component rendered inside expanded `SortableSetlistItem`. Accordion state managed in `EditorLayout`. All changes save via existing bulk update endpoint.

**Tech Stack:** Next.js (Pages Router), styled-components, dnd-kit, TypeScript, Jest, React Testing Library, Rails 7, PostgreSQL

**API Base URL (dev):** `http://localhost:3001`

**Prerequisite:** Rails backend running on port 3001 (`cd backend && rails server -p 3001`)

**Key conventions:**
- No barrel files — import directly from source files
- Theme-driven styles — never hardcode colors/fonts/spacing
- Reuse components — extract shared patterns, prefer prop variants
- TDD — write failing test first, then implement

---

### Task 1: Backend Migration — Rename and Add Schema Fields

**Files:**
- Create: `backend/db/migrate/YYYYMMDDHHMMSS_update_song_performance_config_fields.rb`
- Modify: `backend/app/models/song_performance_config.rb`
- Modify: `backend/app/controllers/api/setlist_songs_controller.rb`
- Modify: `backend/app/models/setlist.rb`
- Modify: `backend/spec/factories/song_performance_configs.rb`
- Modify: `backend/spec/models/song_performance_config_spec.rb`
- Modify: `backend/spec/requests/setlist_songs_spec.rb`
- Modify: `backend/db/seeds.rb`

**Step 1: Write the failing model spec**

Add to `backend/spec/models/song_performance_config_spec.rb`, inside the `"optional fields"` describe block:

```ruby
it "stores lead vocalist ids as array" do
  members = create_list(:member, 2)
  config = create(:song_performance_config, lead_vocalist_ids: members.map(&:id))
  config.reload
  expect(config.lead_vocalist_ids).to eq(members.map(&:id))
end

it "stores solos as JSON array" do
  member = create(:member)
  solos = [{ "member_id" => member.id, "instrument" => "guitar" }]
  config = create(:song_performance_config, solos: solos)
  config.reload
  expect(config.solos).to eq(solos)
end
```

Also update the existing `"stores lead vocalist id"` test — rename it and change it to use the new array field:

Replace the existing test:
```ruby
it "stores lead vocalist id" do
  member = create(:member)
  config = create(:song_performance_config, lead_vocalist_id: member.id)
  config.reload
  expect(config.lead_vocalist_id).to eq(member.id)
end
```

With the new array test above (the `"stores lead vocalist ids as array"` test replaces it).

**Step 2: Run tests to verify they fail**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/song_performance_config_spec.rb -v`

Expected: FAIL — `lead_vocalist_ids` column does not exist.

**Step 3: Generate and write the migration**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails generate migration UpdateSongPerformanceConfigFields
```

Edit the generated migration file:

```ruby
class UpdateSongPerformanceConfigFields < ActiveRecord::Migration[7.1]
  def change
    remove_column :song_performance_configs, :lead_vocalist_id, :integer
    remove_column :song_performance_configs, :guitar_solo_id, :integer
    add_column :song_performance_configs, :lead_vocalist_ids, :integer, array: true, default: []
    add_column :song_performance_configs, :solos, :jsonb, default: []
  end
end
```

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && rails db:migrate`

**Step 4: Update the factory**

Replace `backend/spec/factories/song_performance_configs.rb`:

```ruby
FactoryBot.define do
  factory :song_performance_config do
    setlist_song
    lead_vocalist_ids { [] }
    backup_vocalist_ids { [] }
    solos { [] }
    instrument_overrides { {} }
    free_text_notes { "" }
  end
end
```

**Step 5: Update the model with validation**

Replace `backend/app/models/song_performance_config.rb`:

```ruby
class SongPerformanceConfig < ApplicationRecord
  belongs_to :setlist_song

  validate :solos_structure

  private

  def solos_structure
    return if solos.blank?
    unless solos.is_a?(Array) && solos.all? { |s| s.is_a?(Hash) && s.key?("member_id") && s.key?("instrument") }
      errors.add(:solos, "must be an array of { member_id, instrument } objects")
    end
  end
end
```

**Step 6: Update the serializer in Setlist model**

Modify `backend/app/models/setlist.rb` — change the `song_performance_config` `only` list:

Replace:
```ruby
song_performance_config: {
  only: [:id, :lead_vocalist_id, :backup_vocalist_ids, :guitar_solo_id,
         :instrument_overrides, :free_text_notes]
}
```

With:
```ruby
song_performance_config: {
  only: [:id, :lead_vocalist_ids, :backup_vocalist_ids, :solos,
         :instrument_overrides, :free_text_notes]
}
```

**Step 7: Update the controller**

Modify `backend/app/controllers/api/setlist_songs_controller.rb` — change the config params:

Replace:
```ruby
setlist_song.create_song_performance_config!(
  lead_vocalist_id: config_params[:lead_vocalist_id],
  backup_vocalist_ids: config_params[:backup_vocalist_ids] || [],
  guitar_solo_id: config_params[:guitar_solo_id],
  instrument_overrides: config_params[:instrument_overrides] || {},
  free_text_notes: config_params[:free_text_notes] || ""
)
```

With:
```ruby
setlist_song.create_song_performance_config!(
  lead_vocalist_ids: config_params[:lead_vocalist_ids] || [],
  backup_vocalist_ids: config_params[:backup_vocalist_ids] || [],
  solos: config_params[:solos] || [],
  instrument_overrides: config_params[:instrument_overrides] || {},
  free_text_notes: config_params[:free_text_notes] || ""
)
```

**Step 8: Update seeds**

Modify `backend/db/seeds.rb` — change the seed data to use new fields:

Replace the setlist song creation block (lines 26-42):
```ruby
[
  { song: songs[4], leads: [mike], backups: [sarah], solos: [], notes: "Start with bass riff, drums come in bar 5" },
  { song: songs[2], leads: [sarah], backups: [mike, jake], solos: [{ member_id: mike.id, instrument: "keys" }], notes: "Mike on keys for this one" },
  { song: songs[8], leads: [jake], backups: [], solos: [], notes: "Heavy intro, crowd hype" },
  { song: songs[3], leads: [mike], backups: [sarah, jake], solos: [], notes: "Full energy, keep it tight" },
  { song: songs[5], leads: [sarah], backups: [], solos: [{ member_id: jake.id, instrument: "guitar" }], notes: "Jake guitar solo, Sarah on keys" },
  { song: songs[7], leads: [mike], backups: [sarah], solos: [{ member_id: mike.id, instrument: "guitar" }], notes: "Slow it down, build to crescendo" },
  { song: songs[1], leads: [sarah], backups: [mike, jake], solos: [], notes: "Crowd singalong" },
  { song: songs[9], leads: [jake], backups: [mike], solos: [{ member_id: sarah.id, instrument: "guitar" }, { member_id: mike.id, instrument: "keys" }], notes: "Close out the main set strong" }
].each_with_index do |entry, i|
  ss = setlist.setlist_songs.create!(song: entry[:song], position: i + 1)
  ss.create_song_performance_config!(
    lead_vocalist_ids: entry[:leads].map(&:id),
    backup_vocalist_ids: entry[:backups].map(&:id),
    solos: entry[:solos],
    free_text_notes: entry[:notes]
  )
end
```

**Step 9: Update request specs**

Modify `backend/spec/requests/setlist_songs_spec.rb` — update the test that checks `lead_vocalist_id`:

Replace:
```ruby
{ song_id: song1.id, position: 1, performance_config: { lead_vocalist_id: member.id } },
```

With:
```ruby
{ song_id: song1.id, position: 1, performance_config: { lead_vocalist_ids: [member.id] } },
```

And update the assertion:
Replace:
```ruby
expect(json["setlist_songs"][0]["song_performance_config"]["lead_vocalist_id"]).to eq(member.id)
```

With:
```ruby
expect(json["setlist_songs"][0]["song_performance_config"]["lead_vocalist_ids"]).to eq([member.id])
```

**Step 10: Run all backend tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec -v`

Expected: ALL PASS

**Step 11: Re-seed the database**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:seed:replant
```

**Step 12: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: migrate schema to lead_vocalist_ids array and solos jsonb"
```

---

### Task 2: Update Frontend Types and API

**Files:**
- Modify: `frontend/lib/types.ts`
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/__tests__/lib/api.test.ts`
- Modify: `frontend/components/Editor/EditorLayout.tsx`

**Step 1: Write the failing test**

Update `frontend/__tests__/lib/api.test.ts` — modify the existing `bulkUpdate` test to use the new field names:

Replace the `songs` array in the test:
```ts
const songs = [
  { song_id: 1, position: 1, performance_config: { lead_vocalist_ids: [1], solos: [] } },
  { song_id: 2, position: 2, performance_config: { lead_vocalist_ids: [], solos: [{ member_id: 1, instrument: 'guitar' }] } },
];
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL — TypeScript compilation errors on old field names.

**Step 3: Update types**

Modify `frontend/lib/types.ts` — replace `SongPerformanceConfig`:

```ts
export interface SongPerformanceConfig {
  id: number;
  lead_vocalist_ids: number[];
  backup_vocalist_ids: number[];
  solos: Array<{ member_id: number; instrument: string }>;
  instrument_overrides: Record<string, string>;
  free_text_notes: string;
}
```

**Step 4: Update EditorLayout references**

Modify `frontend/components/Editor/EditorLayout.tsx`:

In `handleAddSong`, replace the `song_performance_config` default:
```ts
song_performance_config: {
  id: 0,
  lead_vocalist_ids: [],
  backup_vocalist_ids: [],
  solos: [],
  instrument_overrides: {},
  free_text_notes: '',
},
```

In `handleSave`, replace the `performance_config` mapping:
```ts
performance_config: {
  lead_vocalist_ids: ss.song_performance_config.lead_vocalist_ids,
  backup_vocalist_ids: ss.song_performance_config.backup_vocalist_ids,
  solos: ss.song_performance_config.solos,
  instrument_overrides: ss.song_performance_config.instrument_overrides,
  free_text_notes: ss.song_performance_config.free_text_notes,
},
```

**Step 5: Update all test fixtures**

Search all test files for `lead_vocalist_id:` (singular) and `guitar_solo_id:` and update them to use the new fields. Files to check:
- `frontend/__tests__/components/EditorLayout.test.tsx`
- `frontend/__tests__/components/EditorSave.test.tsx`
- `frontend/__tests__/components/SetlistPanel.test.tsx`

In each mock `song_performance_config` object, replace:
```ts
lead_vocalist_id: null,
// ...
guitar_solo_id: null,
```

With:
```ts
lead_vocalist_ids: [],
// ...
solos: [],
```

**Step 6: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 7: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: update frontend types and fixtures for new schema fields"
```

---

### Task 3: Pass Members to Editor and Add Expand State

**Files:**
- Modify: `frontend/pages/setlists/[id]/edit.tsx`
- Modify: `frontend/components/Editor/EditorLayout.tsx`
- Modify: `frontend/components/Editor/SetlistPanel.tsx`
- Modify: `frontend/components/Editor/SortableSetlistItem.tsx`
- Create: `frontend/__tests__/components/EditorExpand.test.tsx`

**Step 1: Write the failing test**

Create `frontend/__tests__/components/EditorExpand.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const mockMembers = [
  { id: 1, name: 'Mike', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' as const },
  { id: 2, name: 'Sarah', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' as const },
  { id: 3, name: 'Jake', instruments: ['bass', 'vocals'], role: 'band_member' as const },
  { id: 4, name: 'Dave', instruments: ['drums'], role: 'band_member' as const },
  { id: 5, name: 'Chris', instruments: [], role: 'engineer' as const },
];

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
      song_performance_config: { id: 100, lead_vocalist_ids: [], backup_vocalist_ids: [], solos: [], instrument_overrides: {}, free_text_notes: '' },
    },
    {
      id: 11,
      position: 2,
      song: { id: 2, title: 'Song B', artist: 'Artist B', tempo: 140, key: 'G', time_signature: '4/4', duration: 200 },
      song_performance_config: { id: 101, lead_vocalist_ids: [], backup_vocalist_ids: [], solos: [], instrument_overrides: {}, free_text_notes: '' },
    },
  ],
};

const mockSongs = [
  { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
  { id: 2, title: 'Song B', artist: 'Artist B', tempo: 140, key: 'G', time_signature: '4/4', duration: 200 },
];

describe('Editor expand/collapse', () => {
  beforeEach(() => {
    mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
    mockedApi.songs.list.mockResolvedValue(mockSongs);
  });

  it('expands a song card when clicked', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Song A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Song A'));

    expect(screen.getByText('Lead Vocalists')).toBeInTheDocument();
  });

  it('collapses expanded card when clicked again', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Song A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Song A'));
    expect(screen.getByText('Lead Vocalists')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Song A'));
    expect(screen.queryByText('Lead Vocalists')).not.toBeInTheDocument();
  });

  it('only one card is expanded at a time (accordion)', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getByText('Song A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Song A'));
    expect(screen.getByText('Lead Vocalists')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Song B'));
    // Only one "Lead Vocalists" label should exist (Song B's form)
    expect(screen.getAllByText('Lead Vocalists')).toHaveLength(1);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL — `members` prop not expected.

**Step 3: Update the page route to pass members**

Modify `frontend/pages/setlists/[id]/edit.tsx`:

```tsx
import { useRouter } from 'next/router';
import { useBand } from '@/contexts/BandContext';
import { EditorLayout } from '@/components/Editor/EditorLayout';

export default function EditSetlist() {
  const router = useRouter();
  const { id } = router.query;
  const { band, loading } = useBand();

  if (loading || !band || !id) return null;

  return <EditorLayout setlistId={Number(id)} bandId={band.id} members={band.members} />;
}
```

**Step 4: Update EditorLayout props and add expand state**

Modify `frontend/components/Editor/EditorLayout.tsx`:

Add `Member` to the type import:
```ts
import { SetlistDetail, SetlistSong, Song, Member, SongPerformanceConfig } from '@/lib/types';
```

Update the props interface:
```ts
interface EditorLayoutProps {
  setlistId: number;
  bandId: number;
  members: Member[];
}
```

Update the component signature:
```ts
export function EditorLayout({ setlistId, bandId, members }: EditorLayoutProps) {
```

Add expand state after existing state declarations:
```ts
const [expandedId, setExpandedId] = useState<number | null>(null);
```

Add handlers:
```ts
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
```

Update the `SetlistPanel` JSX to pass new props:
```tsx
<SetlistPanel
  setlistSongs={setlistSongs}
  onReorder={handleReorder}
  onRemove={handleRemoveSong}
  expandedId={expandedId}
  onToggleExpand={handleToggleExpand}
  onConfigChange={handleConfigChange}
  members={members}
/>
```

**Step 5: Update SetlistPanel to pass through props**

Modify `frontend/components/Editor/SetlistPanel.tsx`:

Add imports:
```ts
import { SetlistSong, Member, SongPerformanceConfig } from '@/lib/types';
```

Update the interface:
```ts
interface SetlistPanelProps {
  setlistSongs: SetlistSong[];
  onReorder: (activeId: number, overId: number) => void;
  onRemove: (setlistSongId: number) => void;
  expandedId: number | null;
  onToggleExpand: (id: number) => void;
  onConfigChange: (setlistSongId: number, config: SongPerformanceConfig) => void;
  members: Member[];
}
```

Update the component signature to destructure the new props:
```ts
export function SetlistPanel({ setlistSongs, onReorder, onRemove, expandedId, onToggleExpand, onConfigChange, members }: SetlistPanelProps) {
```

Update the `SortableSetlistItem` render to pass new props:
```tsx
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
/>
```

**Step 6: Update SortableSetlistItem to support expand**

Modify `frontend/components/Editor/SortableSetlistItem.tsx`:

Add imports:
```ts
import { SetlistSong, Member, SongPerformanceConfig } from '@/lib/types';
import { PerformanceConfigForm } from '@/components/Editor/PerformanceConfigForm';
import { useRef, useEffect } from 'react';
```

Update the interface:
```ts
interface SortableSetlistItemProps {
  setlistSong: SetlistSong;
  index: number;
  onRemove: (id: number) => void;
  expanded: boolean;
  onToggleExpand: (id: number) => void;
  onConfigChange: (setlistSongId: number, config: SongPerformanceConfig) => void;
  members: Member[];
  mode: 'edit' | 'live';
}
```

Update the component:
```tsx
export function SortableSetlistItem({
  setlistSong, index, onRemove, expanded, onToggleExpand, onConfigChange, members, mode,
}: SortableSetlistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: setlistSong.id });

  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [expanded]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { song } = setlistSong;

  return (
    <Item ref={setNodeRef} style={style}>
      <div ref={itemRef}>
        <CollapsedRow onClick={() => onToggleExpand(setlistSong.id)}>
          <DragHandle {...attributes} {...listeners} aria-label="Drag to reorder" onClick={(e) => e.stopPropagation()}>
            ⠿
          </DragHandle>
          <Position>{index + 1}</Position>
          <SongInfo>
            <SongTitle>{song.title}</SongTitle>
            <SongMeta>{song.artist} · {song.tempo} BPM · {song.key}</SongMeta>
          </SongInfo>
          <RemoveButton
            onClick={(e) => { e.stopPropagation(); onRemove(setlistSong.id); }}
            aria-label={`Remove ${song.title}`}
          >
            ×
          </RemoveButton>
        </CollapsedRow>
        {expanded && mode === 'edit' && (
          <PerformanceConfigForm
            config={setlistSong.song_performance_config}
            members={members}
            onChange={(updatedConfig) => onConfigChange(setlistSong.id, updatedConfig)}
          />
        )}
      </div>
    </Item>
  );
}
```

Update `Item` styled component to be a column layout:
```ts
const Item = styled.div`
  background: ${({ theme }) => theme.colors.surfaceLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
`;
```

Add `CollapsedRow` styled component (replaces the old flex layout of `Item`):
```ts
const CollapsedRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
  }
`;
```

**Step 7: Create a stub PerformanceConfigForm**

Create `frontend/components/Editor/PerformanceConfigForm.tsx` with a minimal stub so the expand tests pass:

```tsx
import styled from 'styled-components';
import { SongPerformanceConfig, Member } from '@/lib/types';

interface PerformanceConfigFormProps {
  config: SongPerformanceConfig;
  members: Member[];
  onChange: (config: SongPerformanceConfig) => void;
}

export function PerformanceConfigForm({ config, members, onChange }: PerformanceConfigFormProps) {
  return (
    <FormContainer>
      <FieldLabel>Lead Vocalists</FieldLabel>
      <FieldLabel>Backup Vocals</FieldLabel>
      <FieldLabel>Solos</FieldLabel>
      <FieldLabel>Instrument Overrides</FieldLabel>
      <FieldLabel>Notes</FieldLabel>
    </FormContainer>
  );
}

const FormContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FieldLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
```

**Step 8: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 9: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add accordion expand/collapse with stub config form"
```

---

### Task 4: PerformanceConfigForm — Lead Vocalists and Backup Vocals

**Files:**
- Modify: `frontend/components/Editor/PerformanceConfigForm.tsx`
- Create: `frontend/__tests__/components/PerformanceConfigForm.test.tsx`

**Step 1: Write the failing tests**

Create `frontend/__tests__/components/PerformanceConfigForm.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { PerformanceConfigForm } from '@/components/Editor/PerformanceConfigForm';
import { SongPerformanceConfig, Member } from '@/lib/types';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockMembers: Member[] = [
  { id: 1, name: 'Mike', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' },
  { id: 2, name: 'Sarah', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' },
  { id: 3, name: 'Jake', instruments: ['bass', 'vocals'], role: 'band_member' },
  { id: 4, name: 'Dave', instruments: ['drums'], role: 'band_member' },
  { id: 5, name: 'Chris', instruments: [], role: 'engineer' },
];

const emptyConfig: SongPerformanceConfig = {
  id: 1,
  lead_vocalist_ids: [],
  backup_vocalist_ids: [],
  solos: [],
  instrument_overrides: {},
  free_text_notes: '',
};

describe('PerformanceConfigForm', () => {
  describe('Lead Vocalists', () => {
    it('renders checkboxes for band members only (no engineers)', () => {
      renderWithTheme(
        <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={jest.fn()} />
      );

      expect(screen.getByLabelText('Mike')).toBeInTheDocument();
      expect(screen.getByLabelText('Sarah')).toBeInTheDocument();
      expect(screen.getByLabelText('Jake')).toBeInTheDocument();
      expect(screen.getByLabelText('Dave')).toBeInTheDocument();
      expect(screen.queryByLabelText('Chris')).not.toBeInTheDocument();
    });

    it('checks lead vocalist checkboxes based on config', () => {
      const config = { ...emptyConfig, lead_vocalist_ids: [1, 2] };
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={jest.fn()} />
      );

      const leadSection = screen.getByText('Lead Vocalists').closest('div')!;
      const mikeCheckbox = screen.getAllByLabelText('Mike')[0] as HTMLInputElement;
      expect(mikeCheckbox.checked).toBe(true);
    });

    it('calls onChange when lead vocalist is toggled', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={onChange} />
      );

      // Click the first "Mike" checkbox (in Lead Vocalists section)
      const checkboxes = screen.getAllByLabelText('Mike');
      fireEvent.click(checkboxes[0]);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ lead_vocalist_ids: [1] })
      );
    });
  });

  describe('Backup Vocals', () => {
    it('auto-excludes lead vocalists from backup options', () => {
      const config = { ...emptyConfig, lead_vocalist_ids: [1] };
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={jest.fn()} />
      );

      // In Backup Vocals section, Mike should not appear
      const backupSection = screen.getByText('Backup Vocals').closest('div')!;
      const backupCheckboxes = backupSection.querySelectorAll('input[type="checkbox"]');
      const labels = Array.from(backupCheckboxes).map(
        (cb) => cb.closest('label')?.textContent
      );
      expect(labels).not.toContain('Mike');
      expect(labels).toContain('Sarah');
    });

    it('removes member from backup when they become lead', () => {
      const config = { ...emptyConfig, lead_vocalist_ids: [], backup_vocalist_ids: [1] };
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={onChange} />
      );

      // Make Mike a lead vocalist
      const leadCheckboxes = screen.getAllByLabelText('Mike');
      fireEvent.click(leadCheckboxes[0]);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          lead_vocalist_ids: [1],
          backup_vocalist_ids: [], // Mike auto-removed
        })
      );
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL — checkboxes don't exist yet.

**Step 3: Implement Lead Vocalists and Backup Vocals**

Replace `frontend/components/Editor/PerformanceConfigForm.tsx`:

```tsx
import styled from 'styled-components';
import { SongPerformanceConfig, Member } from '@/lib/types';

interface PerformanceConfigFormProps {
  config: SongPerformanceConfig;
  members: Member[];
  onChange: (config: SongPerformanceConfig) => void;
}

export function PerformanceConfigForm({ config, members, onChange }: PerformanceConfigFormProps) {
  const bandMembers = members.filter((m) => m.role === 'band_member');
  const backupEligible = bandMembers.filter((m) => !config.lead_vocalist_ids.includes(m.id));

  const handleLeadToggle = (memberId: number) => {
    const isLead = config.lead_vocalist_ids.includes(memberId);
    const newLeads = isLead
      ? config.lead_vocalist_ids.filter((id) => id !== memberId)
      : [...config.lead_vocalist_ids, memberId];
    const newBackups = config.backup_vocalist_ids.filter((id) => !newLeads.includes(id));
    onChange({ ...config, lead_vocalist_ids: newLeads, backup_vocalist_ids: newBackups });
  };

  const handleBackupToggle = (memberId: number) => {
    const isBackup = config.backup_vocalist_ids.includes(memberId);
    const newBackups = isBackup
      ? config.backup_vocalist_ids.filter((id) => id !== memberId)
      : [...config.backup_vocalist_ids, memberId];
    onChange({ ...config, backup_vocalist_ids: newBackups });
  };

  return (
    <FormContainer>
      <FieldGroup>
        <FieldLabel>Lead Vocalists</FieldLabel>
        <CheckboxGroup>
          {bandMembers.map((m) => (
            <CheckboxLabel key={m.id} htmlFor={`lead-${m.id}`}>
              <input
                type="checkbox"
                id={`lead-${m.id}`}
                checked={config.lead_vocalist_ids.includes(m.id)}
                onChange={() => handleLeadToggle(m.id)}
                aria-label={m.name}
              />
              {m.name}
            </CheckboxLabel>
          ))}
        </CheckboxGroup>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Backup Vocals</FieldLabel>
        <CheckboxGroup>
          {backupEligible.map((m) => (
            <CheckboxLabel key={m.id} htmlFor={`backup-${m.id}`}>
              <input
                type="checkbox"
                id={`backup-${m.id}`}
                checked={config.backup_vocalist_ids.includes(m.id)}
                onChange={() => handleBackupToggle(m.id)}
                aria-label={m.name}
              />
              {m.name}
            </CheckboxLabel>
          ))}
        </CheckboxGroup>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Solos</FieldLabel>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Instrument Overrides</FieldLabel>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Notes</FieldLabel>
      </FieldGroup>
    </FormContainer>
  );
}

const FormContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FieldLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.85rem;
  cursor: pointer;
`;
```

**Step 4: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 5: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add lead vocalist and backup vocal checkboxes to config form"
```

---

### Task 5: PerformanceConfigForm — Solos

**Files:**
- Modify: `frontend/components/Editor/PerformanceConfigForm.tsx`
- Modify: `frontend/__tests__/components/PerformanceConfigForm.test.tsx`

**Step 1: Write the failing tests**

Add to `frontend/__tests__/components/PerformanceConfigForm.test.tsx`:

```tsx
describe('Solos', () => {
  it('renders existing solos', () => {
    const config = {
      ...emptyConfig,
      solos: [{ member_id: 1, instrument: 'guitar' }],
    };
    renderWithTheme(
      <PerformanceConfigForm config={config} members={mockMembers} onChange={jest.fn()} />
    );

    expect(screen.getByDisplayValue('guitar')).toBeInTheDocument();
  });

  it('adds a solo row when Add Solo is clicked', () => {
    const onChange = jest.fn();
    renderWithTheme(
      <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={onChange} />
    );

    fireEvent.click(screen.getByRole('button', { name: /add solo/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        solos: [{ member_id: 0, instrument: '' }],
      })
    );
  });

  it('removes a solo row when remove is clicked', () => {
    const config = {
      ...emptyConfig,
      solos: [
        { member_id: 1, instrument: 'guitar' },
        { member_id: 2, instrument: 'keys' },
      ],
    };
    const onChange = jest.fn();
    renderWithTheme(
      <PerformanceConfigForm config={config} members={mockMembers} onChange={onChange} />
    );

    const removeButtons = screen.getAllByRole('button', { name: /remove solo/i });
    fireEvent.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        solos: [{ member_id: 2, instrument: 'keys' }],
      })
    );
  });

  it('updates solo member when dropdown changes', () => {
    const config = {
      ...emptyConfig,
      solos: [{ member_id: 1, instrument: 'guitar' }],
    };
    const onChange = jest.fn();
    renderWithTheme(
      <PerformanceConfigForm config={config} members={mockMembers} onChange={onChange} />
    );

    const memberSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(memberSelect, { target: { value: '2' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        solos: [{ member_id: 2, instrument: 'guitar' }],
      })
    );
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL

**Step 3: Implement Solos section**

In `frontend/components/Editor/PerformanceConfigForm.tsx`, add solo handlers after the existing handlers:

```tsx
const handleAddSolo = () => {
  onChange({ ...config, solos: [...config.solos, { member_id: 0, instrument: '' }] });
};

const handleRemoveSolo = (index: number) => {
  onChange({ ...config, solos: config.solos.filter((_, i) => i !== index) });
};

const handleSoloChange = (index: number, field: 'member_id' | 'instrument', value: string) => {
  const newSolos = config.solos.map((solo, i) =>
    i === index
      ? { ...solo, [field]: field === 'member_id' ? Number(value) : value }
      : solo
  );
  onChange({ ...config, solos: newSolos });
};
```

Replace the Solos `FieldGroup` stub with:

```tsx
<FieldGroup>
  <FieldLabel>Solos</FieldLabel>
  {config.solos.map((solo, index) => (
    <SoloRow key={index}>
      <Select
        value={solo.member_id || ''}
        onChange={(e) => handleSoloChange(index, 'member_id', e.target.value)}
        aria-label="Solo member"
      >
        <option value="">Select member</option>
        {bandMembers.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </Select>
      <Select
        value={solo.instrument}
        onChange={(e) => handleSoloChange(index, 'instrument', e.target.value)}
        aria-label="Solo instrument"
      >
        <option value="">Select instrument</option>
        {solo.member_id
          ? (members.find((m) => m.id === solo.member_id)?.instruments || []).map((inst) => (
              <option key={inst} value={inst}>{inst}</option>
            ))
          : bandMembers.flatMap((m) => m.instruments)
              .filter((v, i, a) => a.indexOf(v) === i)
              .map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))
        }
      </Select>
      <RemoveButton
        onClick={() => handleRemoveSolo(index)}
        aria-label="Remove solo"
        type="button"
      >
        ×
      </RemoveButton>
    </SoloRow>
  ))}
  <AddButton onClick={handleAddSolo} type="button" aria-label="Add solo">
    + Add Solo
  </AddButton>
</FieldGroup>
```

Add styled components:

```tsx
const SoloRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const Select = styled.select`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  flex: 1;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.1rem;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AddButton = styled.button`
  background: none;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
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
git commit -m "feat: add solos section with add/remove/edit rows"
```

---

### Task 6: PerformanceConfigForm — Instrument Overrides and Notes

**Files:**
- Modify: `frontend/components/Editor/PerformanceConfigForm.tsx`
- Modify: `frontend/__tests__/components/PerformanceConfigForm.test.tsx`

**Step 1: Write the failing tests**

Add to `frontend/__tests__/components/PerformanceConfigForm.test.tsx`:

```tsx
describe('Instrument Overrides', () => {
  it('shows dropdowns only for members with 2+ instruments', () => {
    renderWithTheme(
      <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={jest.fn()} />
    );

    // Mike (3 instruments), Sarah (3), Jake (2) should appear
    // Dave (1 instrument) should NOT appear
    const overridesSection = screen.getByText('Instrument Overrides').closest('div')!;
    expect(overridesSection).toHaveTextContent('Mike');
    expect(overridesSection).toHaveTextContent('Sarah');
    expect(overridesSection).toHaveTextContent('Jake');
    expect(overridesSection).not.toHaveTextContent('Dave');
  });

  it('calls onChange when instrument override is selected', () => {
    const onChange = jest.fn();
    renderWithTheme(
      <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={onChange} />
    );

    const overrideSelects = screen.getAllByLabelText(/override for/i);
    fireEvent.change(overrideSelects[0], { target: { value: 'keys' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        instrument_overrides: { '1': 'keys' },
      })
    );
  });
});

describe('Notes', () => {
  it('renders textarea with current notes', () => {
    const config = { ...emptyConfig, free_text_notes: 'Start with piano' };
    renderWithTheme(
      <PerformanceConfigForm config={config} members={mockMembers} onChange={jest.fn()} />
    );

    expect(screen.getByDisplayValue('Start with piano')).toBeInTheDocument();
  });

  it('calls onChange when notes change', () => {
    const onChange = jest.fn();
    renderWithTheme(
      <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={onChange} />
    );

    fireEvent.change(screen.getByPlaceholderText(/notes/i), { target: { value: 'New note' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ free_text_notes: 'New note' })
    );
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL

**Step 3: Implement Instrument Overrides and Notes**

In `frontend/components/Editor/PerformanceConfigForm.tsx`, add:

Compute multi-instrument members at the top of the component:
```tsx
const multiInstrumentMembers = bandMembers.filter((m) => m.instruments.length >= 2);
```

Add handlers:
```tsx
const handleOverrideChange = (memberId: number, instrument: string) => {
  const newOverrides = { ...config.instrument_overrides };
  if (instrument === '') {
    delete newOverrides[String(memberId)];
  } else {
    newOverrides[String(memberId)] = instrument;
  }
  onChange({ ...config, instrument_overrides: newOverrides });
};

const handleNotesChange = (notes: string) => {
  onChange({ ...config, free_text_notes: notes });
};
```

Replace the Instrument Overrides stub:
```tsx
<FieldGroup>
  <FieldLabel>Instrument Overrides</FieldLabel>
  {multiInstrumentMembers.map((m) => (
    <OverrideRow key={m.id}>
      <MemberName>{m.name}</MemberName>
      <Select
        value={config.instrument_overrides[String(m.id)] || ''}
        onChange={(e) => handleOverrideChange(m.id, e.target.value)}
        aria-label={`Override for ${m.name}`}
      >
        <option value="">Default</option>
        {m.instruments.map((inst) => (
          <option key={inst} value={inst}>{inst}</option>
        ))}
      </Select>
    </OverrideRow>
  ))}
</FieldGroup>
```

Replace the Notes stub:
```tsx
<FieldGroup>
  <FieldLabel>Notes</FieldLabel>
  <NotesTextarea
    value={config.free_text_notes}
    onChange={(e) => handleNotesChange(e.target.value)}
    placeholder="Performance notes..."
    rows={3}
  />
</FieldGroup>
```

Add styled components:
```tsx
const OverrideRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const MemberName = styled.span`
  font-size: 0.85rem;
  min-width: 80px;
`;

const NotesTextarea = styled.textarea`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  font-family: inherit;
  resize: vertical;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
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
git commit -m "feat: add instrument overrides and notes to config form"
```

---

### Task 7: Full Integration Verification and Recordings

**Step 1: Run full backend test suite**

```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec -v
```

Expected: ALL PASS

**Step 2: Run full frontend test suite**

```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose
```

Expected: ALL PASS

**Step 3: Start both servers and verify end-to-end**

```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend && rails server -p 3001 &
cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm run dev &
```

**Step 4: Verify expand/collapse and config editing**

```bash
agent-browser open http://localhost:3000/setlists/{id}/edit && agent-browser wait --load networkidle
agent-browser snapshot -i
# Click a song to expand
agent-browser click "text=<song title>"
agent-browser wait 500
agent-browser snapshot -i
agent-browser screenshot docs/screenshots/editor-expanded-card.png
```

Expected: Expanded card with Lead Vocalists, Backup Vocals, Solos, Instrument Overrides, Notes fields. Next song visible below.

**Step 5: Test editing a config field and saving**

```bash
# Check a lead vocalist checkbox, then save
agent-browser snapshot -i
agent-browser click "<checkbox ref>"
agent-browser click "[aria-label='Save']"
agent-browser wait --load networkidle
agent-browser screenshot docs/screenshots/editor-config-saved.png
```

**Step 6: Record webm flow demos**

Create and run flow scripts for:

1. `frontend/scripts/flows/editor-expand-config.ts` — Navigate to editor, expand a card, edit config fields (lead vocalist, notes), save
2. `frontend/scripts/flows/editor-add-solo.ts` — Navigate to editor, expand a card, add a solo row, select member and instrument, save

```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend
npm run record-flow scripts/flows/editor-expand-config.ts
npm run record-flow scripts/flows/editor-add-solo.ts
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
git commit -m "docs: add config editor screenshots and flow recordings"
```

Phase C frontend is complete. Song cards expand inline (accordion) to edit lead vocalists, backup vocals, solos, instrument overrides, and notes. Auto-scroll keeps next song visible. All changes save via bulk update.
