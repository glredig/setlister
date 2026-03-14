# Per-Member Notes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add personal per-member notes on setlist songs, with a global member picker and autosaving textarea.

**Architecture:** New `member_song_notes` table with upsert API. New `MemberContext` + `AppLayout` for global member picker. `MemberNoteTextarea` component with debounced autosave in the expanded song card. Member notes are fully independent of the existing bulk save flow.

**Tech Stack:** Rails 7, PostgreSQL, Next.js (Pages Router), styled-components, Jest, RSpec

**Spec:** `docs/design-docs/2026-03-13-per-member-notes-design.md`

---

### Task 1: Backend Migration, Model & API

Add `member_song_notes` table and expose via two endpoints: index and upsert.

**Files:**
- Create: `backend/db/migrate/TIMESTAMP_create_member_song_notes.rb`
- Create: `backend/app/models/member_song_note.rb`
- Create: `backend/app/controllers/api/member_song_notes_controller.rb`
- Modify: `backend/app/models/member.rb`
- Modify: `backend/app/models/setlist_song.rb`
- Modify: `backend/config/routes.rb`
- Create: `backend/spec/requests/member_song_notes_spec.rb`
- Create: `backend/spec/factories/member_song_notes.rb`

- [ ] **Step 1: Write the failing tests**

Create `backend/spec/requests/member_song_notes_spec.rb`:

```ruby
require 'rails_helper'

RSpec.describe "MemberSongNotes API" do
  let(:band) { create(:band) }
  let(:member) { create(:member, band: band) }
  let(:setlist) { create(:setlist, band: band) }
  let(:song) { create(:song) }
  let(:setlist_song) { create(:setlist_song, setlist: setlist, song: song, position: 1) }

  describe "GET /api/member_song_notes" do
    it "returns notes for a member on a setlist" do
      MemberSongNote.create!(member: member, setlist_song: setlist_song, note: "Watch the bridge")

      get "/api/member_song_notes", params: { setlist_id: setlist.id, member_id: member.id }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(1)
      expect(json[0]["setlist_song_id"]).to eq(setlist_song.id)
      expect(json[0]["note"]).to eq("Watch the bridge")
    end

    it "does not return notes for other members" do
      other_member = create(:member, band: band, name: "Other")
      MemberSongNote.create!(member: other_member, setlist_song: setlist_song, note: "Not mine")

      get "/api/member_song_notes", params: { setlist_id: setlist.id, member_id: member.id }

      json = JSON.parse(response.body)
      expect(json.length).to eq(0)
    end

    it "does not return notes for other setlists" do
      other_setlist = create(:setlist, band: band, name: "Other Set")
      other_ss = create(:setlist_song, setlist: other_setlist, song: song, position: 1)
      MemberSongNote.create!(member: member, setlist_song: other_ss, note: "Wrong setlist")

      get "/api/member_song_notes", params: { setlist_id: setlist.id, member_id: member.id }

      json = JSON.parse(response.body)
      expect(json.length).to eq(0)
    end
  end

  describe "POST /api/member_song_notes" do
    it "creates a new note" do
      post "/api/member_song_notes", params: {
        member_song_note: { member_id: member.id, setlist_song_id: setlist_song.id, note: "New note" }
      }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["note"]).to eq("New note")
      expect(json["setlist_song_id"]).to eq(setlist_song.id)
    end

    it "updates an existing note" do
      existing = MemberSongNote.create!(member: member, setlist_song: setlist_song, note: "Old")

      post "/api/member_song_notes", params: {
        member_song_note: { member_id: member.id, setlist_song_id: setlist_song.id, note: "Updated" }
      }

      expect(response).to have_http_status(:ok)
      expect(existing.reload.note).to eq("Updated")
    end

    it "deletes the note when note is empty string" do
      MemberSongNote.create!(member: member, setlist_song: setlist_song, note: "To delete")

      post "/api/member_song_notes", params: {
        member_song_note: { member_id: member.id, setlist_song_id: setlist_song.id, note: "" }
      }

      expect(response).to have_http_status(:no_content)
      expect(MemberSongNote.count).to eq(0)
    end

    it "returns no_content when deleting a non-existent note with empty string" do
      post "/api/member_song_notes", params: {
        member_song_note: { member_id: member.id, setlist_song_id: setlist_song.id, note: "" }
      }

      expect(response).to have_http_status(:no_content)
    end
  end
end
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && bundle exec rspec spec/requests/member_song_notes_spec.rb -v`
Expected: All fail — `MemberSongNote` not defined, no route matches.

- [ ] **Step 3: Generate migration**

Run:
```bash
cd backend && rails generate migration CreateMemberSongNotes member:references setlist_song:references note:text
```

Then edit the generated migration to add the unique index and not-null constraints:

```ruby
class CreateMemberSongNotes < ActiveRecord::Migration[7.1]
  def change
    create_table :member_song_notes do |t|
      t.references :member, null: false, foreign_key: true
      t.references :setlist_song, null: false, foreign_key: true
      t.text :note, null: false

      t.timestamps
    end

    add_index :member_song_notes, [:member_id, :setlist_song_id], unique: true
  end
end
```

Run: `cd backend && rails db:migrate`

- [ ] **Step 4: Create the model**

Create `backend/app/models/member_song_note.rb`:

```ruby
class MemberSongNote < ApplicationRecord
  belongs_to :member
  belongs_to :setlist_song

  validates :note, presence: true
  validates :member_id, uniqueness: { scope: :setlist_song_id }
end
```

- [ ] **Step 5: Add associations to existing models**

In `backend/app/models/member.rb`, add after `belongs_to :band`:

```ruby
has_many :member_song_notes, dependent: :destroy
```

In `backend/app/models/setlist_song.rb`, add after `has_one :song_performance_config`:

```ruby
has_many :member_song_notes, dependent: :destroy
```

- [ ] **Step 6: Create the factory**

Create `backend/spec/factories/member_song_notes.rb`:

```ruby
FactoryBot.define do
  factory :member_song_note do
    member
    setlist_song
    note { "Remember the bridge section" }
  end
end
```

- [ ] **Step 7: Add routes**

In `backend/config/routes.rb`, add inside the `namespace :api do` block, after the `resources :setlists` block:

```ruby
get 'member_song_notes', to: 'member_song_notes#index'
post 'member_song_notes', to: 'member_song_notes#upsert'
```

- [ ] **Step 8: Create the controller**

Create `backend/app/controllers/api/member_song_notes_controller.rb`:

```ruby
class Api::MemberSongNotesController < ApplicationController
  def index
    notes = MemberSongNote
      .joins(:setlist_song)
      .where(member_id: params[:member_id], setlist_songs: { setlist_id: params[:setlist_id] })

    render json: notes.as_json(only: [:id, :setlist_song_id, :note])
  end

  def upsert
    if note_params[:note].blank?
      existing = MemberSongNote.find_by(
        member_id: note_params[:member_id],
        setlist_song_id: note_params[:setlist_song_id]
      )
      existing&.destroy!
      head :no_content
    else
      note = MemberSongNote.find_or_initialize_by(
        member_id: note_params[:member_id],
        setlist_song_id: note_params[:setlist_song_id]
      )
      note.note = note_params[:note]
      note.save!
      render json: note.as_json(only: [:id, :setlist_song_id, :note])
    end
  end

  private

  def note_params
    params.require(:member_song_note).permit(:member_id, :setlist_song_id, :note)
  end
end
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `cd backend && bundle exec rspec spec/requests/member_song_notes_spec.rb -v`
Expected: All 6 tests pass.

- [ ] **Step 10: Run all backend tests**

Run: `cd backend && bundle exec rspec`
Expected: All 76+ tests pass, 0 failures.

- [ ] **Step 11: Commit**

```bash
git add backend/db/migrate/ backend/db/schema.rb backend/app/models/member_song_note.rb backend/app/models/member.rb backend/app/models/setlist_song.rb backend/app/controllers/api/member_song_notes_controller.rb backend/config/routes.rb backend/spec/requests/member_song_notes_spec.rb backend/spec/factories/member_song_notes.rb
git commit -m "feat: add member_song_notes table and API"
```

---

### Task 2: Frontend Types & API Client

Add TypeScript types and API client methods for member song notes.

**Files:**
- Modify: `frontend/lib/types.ts`
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/__tests__/lib/api.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `frontend/__tests__/lib/api.test.ts`, inside the top-level `describe` block, add a new `describe('memberSongNotes')` block:

```typescript
describe('memberSongNotes', () => {
  it('lists notes for a member on a setlist', async () => {
    const mockNotes = [{ id: 1, setlist_song_id: 10, note: 'Watch the bridge' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockNotes),
    });

    const result = await api.memberSongNotes.list(1, 5);

    expect(result).toEqual(mockNotes);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toContain('/api/member_song_notes?setlist_id=1&member_id=5');
  });

  it('upserts a member note', async () => {
    const mockNote = { id: 1, setlist_song_id: 10, note: 'Updated note' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockNote),
    });

    const result = await api.memberSongNotes.upsert({
      member_id: 5,
      setlist_song_id: 10,
      note: 'Updated note',
    });

    expect(result.note).toBe('Updated note');
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].method).toBe('POST');
    const body = JSON.parse(fetchCall[1].body);
    expect(body.member_song_note.member_id).toBe(5);
  });

  it('returns undefined when upserting empty note (204)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await api.memberSongNotes.upsert({
      member_id: 5,
      setlist_song_id: 10,
      note: '',
    });

    expect(result).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPatterns="api.test" --verbose`
Expected: FAIL — `api.memberSongNotes` does not exist.

- [ ] **Step 3: Update types**

In `frontend/lib/types.ts`, add at the end of the file:

```typescript
export interface MemberSongNote {
  id: number;
  setlist_song_id: number;
  note: string;
}

export interface MemberSongNoteUpsert {
  member_id: number;
  setlist_song_id: number;
  note: string;
}
```

- [ ] **Step 4: Update API client**

In `frontend/lib/api.ts`, add a new `memberSongNotes` namespace inside the `api` object, after the `songs` namespace:

```typescript
memberSongNotes: {
  list: (setlistId: number, memberId: number) =>
    request<import('./types').MemberSongNote[]>(
      `/api/member_song_notes?setlist_id=${setlistId}&member_id=${memberId}`
    ),
  upsert: (data: import('./types').MemberSongNoteUpsert) =>
    request<import('./types').MemberSongNote>(`/api/member_song_notes`, {
      method: 'POST',
      body: JSON.stringify({ member_song_note: data }),
    }),
},
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPatterns="api.test" --verbose`
Expected: All pass.

- [ ] **Step 6: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All 51+ tests pass.

- [ ] **Step 7: Commit**

```bash
git add frontend/lib/types.ts frontend/lib/api.ts frontend/__tests__/lib/api.test.ts
git commit -m "feat: add member song notes types and API client"
```

---

### Task 3: MemberContext & Member Picker

Create `MemberContext` for global member selection, and `AppLayout` with the member picker dropdown.

**Files:**
- Create: `frontend/contexts/MemberContext.tsx`
- Create: `frontend/components/AppLayout.tsx`
- Create: `frontend/__tests__/contexts/MemberContext.test.tsx`
- Create: `frontend/__tests__/components/AppLayout.test.tsx`
- Modify: `frontend/pages/_app.tsx`

- [ ] **Step 1: Write the failing tests for MemberContext**

Create `frontend/__tests__/contexts/MemberContext.test.tsx`:

```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { MemberProvider, useMember } from '@/contexts/MemberContext';
import { BandProvider } from '@/contexts/BandContext';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

const mockBand = {
  id: 1,
  name: 'Test Band',
  members: [
    { id: 1, name: 'Mike', instruments: ['guitar'], role: 'band_member' as const },
    { id: 2, name: 'Sarah', instruments: ['vocals'], role: 'band_member' as const },
  ],
};

function TestConsumer() {
  const { currentMember, setCurrentMember } = useMember();
  return (
    <div>
      <span data-testid="current">{currentMember?.name ?? 'none'}</span>
      <button onClick={() => setCurrentMember(mockBand.members[0])}>Select Mike</button>
      <button onClick={() => setCurrentMember(null)}>Clear</button>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  mockedApi.bands.get.mockResolvedValue(mockBand);
  return render(
    <ThemeProvider theme={theme}>
      <BandProvider bandId={1}>
        <MemberProvider>
          {ui}
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}

describe('MemberContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no member selected', async () => {
    renderWithProviders(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('none');
    });
  });

  it('allows selecting a member', async () => {
    renderWithProviders(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('none');
    });

    fireEvent.click(screen.getByText('Select Mike'));

    expect(screen.getByTestId('current')).toHaveTextContent('Mike');
  });

  it('persists selection to localStorage', async () => {
    renderWithProviders(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('none');
    });

    fireEvent.click(screen.getByText('Select Mike'));

    expect(localStorage.getItem('setlister_member_id_1')).toBe('1');
  });

  it('restores selection from localStorage', async () => {
    localStorage.setItem('setlister_member_id_1', '2');

    renderWithProviders(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('Sarah');
    });
  });

  it('resets to null if stored member not found in band', async () => {
    localStorage.setItem('setlister_member_id_1', '999');

    renderWithProviders(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('none');
    });
    expect(localStorage.getItem('setlister_member_id_1')).toBeNull();
  });

  it('clears selection and localStorage', async () => {
    localStorage.setItem('setlister_member_id_1', '1');

    renderWithProviders(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('Mike');
    });

    fireEvent.click(screen.getByText('Clear'));

    expect(screen.getByTestId('current')).toHaveTextContent('none');
    expect(localStorage.getItem('setlister_member_id_1')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPatterns="MemberContext" --verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement MemberContext**

Create `frontend/contexts/MemberContext.tsx`:

```typescript
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Member } from '@/lib/types';
import { useBand } from '@/contexts/BandContext';

interface MemberContextValue {
  currentMember: Member | null;
  setCurrentMember: (member: Member | null) => void;
}

const MemberContext = createContext<MemberContextValue>({
  currentMember: null,
  setCurrentMember: () => {},
});

export function MemberProvider({ children }: { children: ReactNode }) {
  const { band } = useBand();
  const [currentMember, setCurrentMemberState] = useState<Member | null>(null);

  // Restore from localStorage once band loads
  useEffect(() => {
    if (!band) return;

    const storageKey = `setlister_member_id_${band.id}`;
    const storedId = localStorage.getItem(storageKey);

    if (storedId) {
      const found = band.members.find((m) => m.id === Number(storedId));
      if (found) {
        setCurrentMemberState(found);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [band]);

  const setCurrentMember = useCallback((member: Member | null) => {
    if (!band) return;

    const storageKey = `setlister_member_id_${band.id}`;
    setCurrentMemberState(member);

    if (member) {
      localStorage.setItem(storageKey, String(member.id));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [band]);

  return (
    <MemberContext.Provider value={{ currentMember, setCurrentMember }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}
```

- [ ] **Step 4: Run MemberContext tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPatterns="MemberContext" --verbose`
Expected: All 6 tests pass.

- [ ] **Step 5: Write failing tests for AppLayout**

Create `frontend/__tests__/components/AppLayout.test.tsx`:

```typescript
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { AppLayout } from '@/components/AppLayout';
import { BandProvider } from '@/contexts/BandContext';
import { MemberProvider } from '@/contexts/MemberContext';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

const mockBand = {
  id: 1,
  name: 'Test Band',
  members: [
    { id: 1, name: 'Mike', instruments: ['guitar'], role: 'band_member' as const },
    { id: 2, name: 'Sarah', instruments: ['vocals'], role: 'band_member' as const },
    { id: 3, name: 'Chris', instruments: [], role: 'engineer' as const },
  ],
};

function renderWithProviders(ui: React.ReactElement) {
  mockedApi.bands.get.mockResolvedValue(mockBand);
  return render(
    <ThemeProvider theme={theme}>
      <BandProvider bandId={1}>
        <MemberProvider>
          {ui}
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the member picker dropdown', async () => {
    renderWithProviders(
      <AppLayout><div>Page content</div></AppLayout>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Select member')).toBeInTheDocument();
    });
  });

  it('renders children', async () => {
    renderWithProviders(
      <AppLayout><div>Page content</div></AppLayout>
    );

    await waitFor(() => {
      expect(screen.getByText('Page content')).toBeInTheDocument();
    });
  });

  it('shows all members including engineers in the dropdown', async () => {
    renderWithProviders(
      <AppLayout><div>Content</div></AppLayout>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Select member')).toBeInTheDocument();
    });

    const select = screen.getByLabelText('Select member');
    expect(select).toContainHTML('Mike');
    expect(select).toContainHTML('Sarah');
    expect(select).toContainHTML('Chris');
  });

  it('selects a member when dropdown changes', async () => {
    renderWithProviders(
      <AppLayout><div>Content</div></AppLayout>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Select member')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Select member'), { target: { value: '1' } });

    expect((screen.getByLabelText('Select member') as HTMLSelectElement).value).toBe('1');
  });
});
```

- [ ] **Step 6: Run AppLayout tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPatterns="AppLayout" --verbose`
Expected: FAIL — module not found.

- [ ] **Step 7: Implement AppLayout**

Create `frontend/components/AppLayout.tsx`:

```typescript
import { ReactNode } from 'react';
import styled from 'styled-components';
import { useBand } from '@/contexts/BandContext';
import { useMember } from '@/contexts/MemberContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { band } = useBand();
  const { currentMember, setCurrentMember } = useMember();

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memberId = Number(e.target.value);
    if (memberId === 0) {
      setCurrentMember(null);
      return;
    }
    const member = band?.members.find((m) => m.id === memberId);
    if (member) setCurrentMember(member);
  };

  return (
    <Wrapper>
      {band && (
        <TopBar>
          <BandName>{band.name}</BandName>
          <MemberSelect
            value={currentMember?.id ?? 0}
            onChange={handleMemberChange}
            aria-label="Select member"
          >
            <option value={0}>Select member...</option>
            {band.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </MemberSelect>
        </TopBar>
      )}
      <Main>{children}</Main>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const BandName = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MemberSelect = styled.select`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
`;

const Main = styled.main`
  flex: 1;
  min-height: 0;
`;
```

- [ ] **Step 8: Run AppLayout tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPatterns="AppLayout" --verbose`
Expected: All 4 tests pass.

- [ ] **Step 9: Wire into _app.tsx**

In `frontend/pages/_app.tsx`, update to:

```typescript
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { BandProvider } from '@/contexts/BandContext';
import { MemberProvider } from '@/contexts/MemberContext';
import { AppLayout } from '@/components/AppLayout';

const BAND_ID = Number(process.env.NEXT_PUBLIC_BAND_ID) || 1;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BandProvider bandId={BAND_ID}>
        <MemberProvider>
          <AppLayout>
            <Component {...pageProps} />
          </AppLayout>
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 10: Update EditorLayout to remove 100vh height**

`EditorLayout` currently sets `height: 100vh` on its container. With `AppLayout` wrapping it (which also uses `height: 100vh` plus a top bar), this would cause overflow. Update the `Container` styled component in `frontend/components/Editor/EditorLayout.tsx`:

Change:
```typescript
const Container = styled.div`
  height: 100vh;
```

To:
```typescript
const Container = styled.div`
  height: 100%;
```

- [ ] **Step 11: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All tests pass. Note: existing component tests render individual components (not pages), so they don't go through `_app.tsx` and won't be affected by the `AppLayout` wrapping. The `EditorLayout` tests will be updated in Task 5 to add provider wrappers.

- [ ] **Step 12: Commit**

```bash
git add frontend/contexts/MemberContext.tsx frontend/components/AppLayout.tsx frontend/pages/_app.tsx frontend/components/Editor/EditorLayout.tsx frontend/__tests__/contexts/MemberContext.test.tsx frontend/__tests__/components/AppLayout.test.tsx
git commit -m "feat: add MemberContext and AppLayout with member picker"
```

---

### Task 4: MemberNoteTextarea Component

Create a self-contained textarea component with debounced autosave and save indicators.

**Files:**
- Create: `frontend/components/Editor/MemberNoteTextarea.tsx`
- Create: `frontend/__tests__/components/MemberNoteTextarea.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `frontend/__tests__/components/MemberNoteTextarea.test.tsx`:

```typescript
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { MemberNoteTextarea } from '@/components/Editor/MemberNoteTextarea';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

jest.useFakeTimers();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('MemberNoteTextarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial note value', () => {
    renderWithTheme(
      <MemberNoteTextarea
        memberId={1}
        setlistSongId={10}
        initialNote="Watch the bridge"
      />
    );

    expect(screen.getByLabelText('My Notes')).toHaveValue('Watch the bridge');
  });

  it('renders empty when no initial note', () => {
    renderWithTheme(
      <MemberNoteTextarea
        memberId={1}
        setlistSongId={10}
        initialNote=""
      />
    );

    expect(screen.getByLabelText('My Notes')).toHaveValue('');
  });

  it('debounces save after typing', async () => {
    mockedApi.memberSongNotes.upsert.mockResolvedValue({ id: 1, setlist_song_id: 10, note: 'New note' });

    renderWithTheme(
      <MemberNoteTextarea
        memberId={1}
        setlistSongId={10}
        initialNote=""
      />
    );

    fireEvent.change(screen.getByLabelText('My Notes'), { target: { value: 'New note' } });

    // Should not have saved yet
    expect(mockedApi.memberSongNotes.upsert).not.toHaveBeenCalled();

    // Advance past debounce
    act(() => { jest.advanceTimersByTime(1000); });

    expect(mockedApi.memberSongNotes.upsert).toHaveBeenCalledWith({
      member_id: 1,
      setlist_song_id: 10,
      note: 'New note',
    });
  });

  it('saves on blur if changed', () => {
    mockedApi.memberSongNotes.upsert.mockResolvedValue({ id: 1, setlist_song_id: 10, note: 'Blurred note' });

    renderWithTheme(
      <MemberNoteTextarea
        memberId={1}
        setlistSongId={10}
        initialNote=""
      />
    );

    fireEvent.change(screen.getByLabelText('My Notes'), { target: { value: 'Blurred note' } });
    fireEvent.blur(screen.getByLabelText('My Notes'));

    expect(mockedApi.memberSongNotes.upsert).toHaveBeenCalledWith({
      member_id: 1,
      setlist_song_id: 10,
      note: 'Blurred note',
    });
  });

  it('does not save on blur if unchanged', () => {
    renderWithTheme(
      <MemberNoteTextarea
        memberId={1}
        setlistSongId={10}
        initialNote="Same"
      />
    );

    fireEvent.blur(screen.getByLabelText('My Notes'));

    expect(mockedApi.memberSongNotes.upsert).not.toHaveBeenCalled();
  });

  it('shows Saved indicator after successful save', async () => {
    mockedApi.memberSongNotes.upsert.mockResolvedValue({ id: 1, setlist_song_id: 10, note: 'Note' });

    renderWithTheme(
      <MemberNoteTextarea
        memberId={1}
        setlistSongId={10}
        initialNote=""
      />
    );

    fireEvent.change(screen.getByLabelText('My Notes'), { target: { value: 'Note' } });
    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  it('shows Save failed indicator on error', async () => {
    mockedApi.memberSongNotes.upsert.mockRejectedValue(new Error('Network error'));

    renderWithTheme(
      <MemberNoteTextarea
        memberId={1}
        setlistSongId={10}
        initialNote=""
      />
    );

    fireEvent.change(screen.getByLabelText('My Notes'), { target: { value: 'Will fail' } });
    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPatterns="MemberNoteTextarea" --verbose`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement MemberNoteTextarea**

Create `frontend/components/Editor/MemberNoteTextarea.tsx`:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { api } from '@/lib/api';

interface MemberNoteTextareaProps {
  memberId: number;
  setlistSongId: number;
  initialNote: string;
}

export function MemberNoteTextarea({ memberId, setlistSongId, initialNote }: MemberNoteTextareaProps) {
  const [value, setValue] = useState(initialNote);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const lastSavedRef = useRef(initialNote);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when initialNote changes (e.g., member switch)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue(initialNote);
    lastSavedRef.current = initialNote;
    setSaveStatus('idle');
  }, [initialNote]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, []);

  const save = useCallback(async (note: string) => {
    if (note === lastSavedRef.current) return;

    try {
      await api.memberSongNotes.upsert({
        member_id: memberId,
        setlist_song_id: setlistSongId,
        note,
      });
      lastSavedRef.current = note;
      setSaveStatus('saved');

      if (fadeRef.current) clearTimeout(fadeRef.current);
      fadeRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [memberId, setlistSongId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(newValue), 1000);
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value !== lastSavedRef.current) {
      save(value);
    }
  };

  return (
    <Container>
      <LabelRow>
        <Label htmlFor={`member-note-${setlistSongId}`}>My Notes</Label>
        {saveStatus === 'saved' && <StatusSaved>Saved</StatusSaved>}
        {saveStatus === 'error' && <StatusError>Save failed</StatusError>}
      </LabelRow>
      <Textarea
        id={`member-note-${setlistSongId}`}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Your personal notes..."
        rows={2}
        aria-label="My Notes"
      />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusSaved = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const StatusError = styled.span`
  font-size: 0.75rem;
  color: #e74c3c;
`;

const Textarea = styled.textarea`
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPatterns="MemberNoteTextarea" --verbose`
Expected: All 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/components/Editor/MemberNoteTextarea.tsx frontend/__tests__/components/MemberNoteTextarea.test.tsx
git commit -m "feat: add MemberNoteTextarea with debounced autosave"
```

---

### Task 5: Integrate Member Notes into Editor

Wire member notes into the expanded song card and EditorLayout data flow.

**Files:**
- Modify: `frontend/components/Editor/EditorLayout.tsx`
- Modify: `frontend/components/Editor/SortableSetlistItem.tsx`
- Modify: `frontend/components/Editor/PerformanceConfigForm.tsx`
- Modify: `frontend/__tests__/components/EditorLayout.test.tsx`

- [ ] **Step 1: Write the failing test and update test infrastructure**

`EditorLayout` will now call `useMember()`, so ALL test files that render `EditorLayout` need to wrap with `BandProvider` + `MemberProvider`. Update three test files:

**In `frontend/__tests__/components/EditorLayout.test.tsx`:**

Add imports:
```typescript
import { MemberProvider } from '@/contexts/MemberContext';
import { BandProvider } from '@/contexts/BandContext';
```

Add `mockBand` constant after `mockedApi`:
```typescript
const mockBand = {
  id: 1,
  name: 'Test Band',
  members: [
    { id: 1, name: 'Mike', instruments: ['guitar'], role: 'band_member' as const },
  ],
};
```

Update `renderWithTheme` to wrap with providers (no localStorage — existing tests run without a member selected):
```typescript
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <BandProvider bandId={1}>
        <MemberProvider>
          {ui}
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}
```

Update `beforeEach` to also mock `bands.get`:
```typescript
beforeEach(() => {
  localStorage.clear();
  mockedApi.bands.get.mockResolvedValue(mockBand);
  mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
  mockedApi.songs.list.mockResolvedValue(mockSongs);
  mockedApi.memberSongNotes.list.mockResolvedValue([]);
});
```

Add the new test at the end of the describe block:
```typescript
it('renders My Notes textarea when a member is selected', async () => {
  localStorage.setItem('setlister_member_id_1', '1');
  mockedApi.memberSongNotes.list.mockResolvedValue([
    { id: 1, setlist_song_id: 10, note: 'My personal note' },
  ]);

  renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={mockBand.members} />);

  await waitFor(() => {
    expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('Song A'));

  await waitFor(() => {
    expect(screen.getByLabelText('My Notes')).toHaveValue('My personal note');
  });
});
```

**In `frontend/__tests__/components/EditorExpand.test.tsx`:**

Add imports:
```typescript
import { MemberProvider } from '@/contexts/MemberContext';
import { BandProvider } from '@/contexts/BandContext';
```

Add `mockBand` constant after `mockedApi`:
```typescript
const mockBand = {
  id: 1,
  name: 'Test Band',
  members: [
    { id: 1, name: 'Mike', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' as const },
  ],
};
```

Update `renderWithTheme`:
```typescript
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <BandProvider bandId={1}>
        <MemberProvider>
          {ui}
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}
```

Update `beforeEach`:
```typescript
beforeEach(() => {
  localStorage.clear();
  mockedApi.bands.get.mockResolvedValue(mockBand);
  mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
  mockedApi.songs.list.mockResolvedValue(mockSongs);
  mockedApi.memberSongNotes.list.mockResolvedValue([]);
});
```

**In `frontend/__tests__/components/EditorSave.test.tsx`:**

Same pattern. Add imports:
```typescript
import { MemberProvider } from '@/contexts/MemberContext';
import { BandProvider } from '@/contexts/BandContext';
```

Add `mockBand` constant after `mockedApi`:
```typescript
const mockBand = {
  id: 1,
  name: 'Test Band',
  members: [],
};
```

Update `renderWithTheme`:
```typescript
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <BandProvider bandId={1}>
        <MemberProvider>
          {ui}
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}
```

Update `beforeEach`:
```typescript
beforeEach(() => {
  localStorage.clear();
  mockedApi.bands.get.mockResolvedValue(mockBand);
  mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
  mockedApi.songs.list.mockResolvedValue(mockSongs);
  mockedApi.memberSongNotes.list.mockResolvedValue([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPatterns="EditorLayout" --verbose`
Expected: FAIL — `memberSongNotes` not called, My Notes not rendered.

- [ ] **Step 3: Update EditorLayout to fetch and pass member notes**

In `frontend/components/Editor/EditorLayout.tsx`:

Add imports:
```typescript
import { useMember } from '@/contexts/MemberContext';
```

Add state and fetch logic after existing state declarations:
```typescript
const { currentMember } = useMember();
const [memberNotes, setMemberNotes] = useState<Record<number, string>>({});
```

Add a `useEffect` to fetch member notes when `currentMember` changes (only after initial load completes):
```typescript
useEffect(() => {
  if (!currentMember || loading) return;

  api.memberSongNotes.list(setlistId, currentMember.id).then((notes) => {
    const noteMap: Record<number, string> = {};
    notes.forEach((n) => { noteMap[n.setlist_song_id] = n.note; });
    setMemberNotes(noteMap);
  });
}, [currentMember, setlistId, loading]);
```

Pass `memberNotes` and `currentMember` down to `SetlistPanel`:
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
  memberNotes={memberNotes}
  currentMemberId={currentMember?.id ?? null}
/>
```

- [ ] **Step 4: Update SetlistPanel to pass member notes through**

In `frontend/components/Editor/SetlistPanel.tsx`:

Update the interface to add:
```typescript
memberNotes: Record<number, string>;
currentMemberId: number | null;
```

Update the function signature to destructure the new props.

Pass them to `SortableSetlistItem`:
```typescript
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
```

- [ ] **Step 5: Update SortableSetlistItem to pass member note to PerformanceConfigForm**

In `frontend/components/Editor/SortableSetlistItem.tsx`:

Add to the interface:
```typescript
memberNote?: string;
currentMemberId?: number | null;
```

Update function signature. Pass to `PerformanceConfigForm`:
```typescript
{expanded && mode === 'edit' && (
  <PerformanceConfigForm
    config={setlistSong.song_performance_config}
    members={members}
    onChange={(config) => onConfigChange(setlistSong.id, config)}
    memberNote={memberNote}
    currentMemberId={currentMemberId}
    setlistSongId={setlistSong.id}
  />
)}
```

- [ ] **Step 6: Update PerformanceConfigForm to render MemberNoteTextarea**

In `frontend/components/Editor/PerformanceConfigForm.tsx`:

Add import:
```typescript
import { MemberNoteTextarea } from '@/components/Editor/MemberNoteTextarea';
```

Update the interface:
```typescript
interface PerformanceConfigFormProps {
  config: SongPerformanceConfig;
  members: Member[];
  onChange: (config: SongPerformanceConfig) => void;
  memberNote?: string;
  currentMemberId?: number | null;
  setlistSongId?: number;
}
```

Update the function signature to destructure the new props.

Add the MemberNoteTextarea at the end of the form, after the Notes `FieldGroup`:
```typescript
{currentMemberId && setlistSongId && (
  <FieldGroup>
    <MemberNoteTextarea
      memberId={currentMemberId}
      setlistSongId={setlistSongId}
      initialNote={memberNote ?? ''}
    />
  </FieldGroup>
)}
```

- [ ] **Step 7: Update existing tests to pass new required props**

In `frontend/__tests__/components/SetlistPanel.test.tsx`, add `memberNotes={{}}` and `currentMemberId={null}` to every `<SetlistPanel>` render call.

Note: `EditorExpand.test.tsx` and `EditorSave.test.tsx` were already updated in Step 1 to wrap with providers and mock `memberSongNotes.list`.

- [ ] **Step 8: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add frontend/components/Editor/EditorLayout.tsx frontend/components/Editor/SetlistPanel.tsx frontend/components/Editor/SortableSetlistItem.tsx frontend/components/Editor/PerformanceConfigForm.tsx frontend/__tests__/components/EditorLayout.test.tsx frontend/__tests__/components/EditorExpand.test.tsx frontend/__tests__/components/EditorSave.test.tsx frontend/__tests__/components/SetlistPanel.test.tsx
git commit -m "feat: integrate member notes into editor"
```

---

### Task 6: Seeds, Cleanup & Final Verification

Update seeds, archive the duration plan, and run full test suite.

**Files:**
- Modify: `backend/db/seeds.rb`
- Move: `docs/exec-plans/active/2026-03-10-setlist-duration.md` → `docs/exec-plans/completed/`

- [ ] **Step 1: Update seeds to include member notes**

In `backend/db/seeds.rb`, add after the `each_with_index` block that creates setlist songs (after line 43):

```ruby
# Add some personal member notes
setlist.setlist_songs.each do |ss|
  MemberSongNote.create!(member: mike, setlist_song: ss, note: "Mike's note for #{ss.song.title}")
end
MemberSongNote.create!(member: sarah, setlist_song: setlist.setlist_songs.first, note: "Sarah: Remember to harmonize on chorus")
```

Update the puts line to include member notes count:
```ruby
puts "Seeded: #{Band.count} band, #{Member.count} members, #{Song.count} songs, #{Setlist.count} setlist with #{SetlistSong.count} songs, #{MemberSongNote.count} member notes"
```

- [ ] **Step 2: Re-seed the database**

Run: `cd backend && rails db:seed:replant`

- [ ] **Step 3: Run all backend tests**

Run: `cd backend && bundle exec rspec`
Expected: All pass.

- [ ] **Step 4: Run all frontend tests**

Run: `cd frontend && npm test`
Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add backend/db/seeds.rb
git commit -m "feat: add member notes to seed data"
```

---

## File Map

| File | Action | Task |
|------|--------|------|
| `backend/db/migrate/TIMESTAMP_create_member_song_notes.rb` | Create | 1 |
| `backend/app/models/member_song_note.rb` | Create | 1 |
| `backend/app/controllers/api/member_song_notes_controller.rb` | Create | 1 |
| `backend/app/models/member.rb` | Modify | 1 |
| `backend/app/models/setlist_song.rb` | Modify | 1 |
| `backend/config/routes.rb` | Modify | 1 |
| `backend/spec/requests/member_song_notes_spec.rb` | Create | 1 |
| `backend/spec/factories/member_song_notes.rb` | Create | 1 |
| `backend/db/seeds.rb` | Modify | 6 |
| `frontend/lib/types.ts` | Modify | 2 |
| `frontend/lib/api.ts` | Modify | 2 |
| `frontend/__tests__/lib/api.test.ts` | Modify | 2 |
| `frontend/contexts/MemberContext.tsx` | Create | 3 |
| `frontend/components/AppLayout.tsx` | Create | 3 |
| `frontend/__tests__/contexts/MemberContext.test.tsx` | Create | 3 |
| `frontend/__tests__/components/AppLayout.test.tsx` | Create | 3 |
| `frontend/pages/_app.tsx` | Modify | 3 |
| `frontend/components/Editor/EditorLayout.tsx` | Modify | 3, 5 |
| `frontend/components/Editor/MemberNoteTextarea.tsx` | Create | 4 |
| `frontend/__tests__/components/MemberNoteTextarea.test.tsx` | Create | 4 |
| `frontend/components/Editor/SetlistPanel.tsx` | Modify | 5 |
| `frontend/components/Editor/SortableSetlistItem.tsx` | Modify | 5 |
| `frontend/components/Editor/PerformanceConfigForm.tsx` | Modify | 5 |
| `frontend/__tests__/components/EditorLayout.test.tsx` | Modify | 5 |
| `frontend/__tests__/components/EditorExpand.test.tsx` | Modify | 5 |
| `frontend/__tests__/components/EditorSave.test.tsx` | Modify | 5 |
| `frontend/__tests__/components/SetlistPanel.test.tsx` | Modify | 5 |
