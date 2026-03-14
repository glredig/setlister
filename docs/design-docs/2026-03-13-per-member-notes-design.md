# Per-Member Notes Design

**Goal:** Allow each band member to have their own personal notes on each song in a setlist, alongside the existing shared notes.

**Context:** The current `free_text_notes` field on `SongPerformanceConfig` is shared — visible to all members. Different band members need different reminders per song (e.g., a guitarist's note about a riff vs. a vocalist's note about lyrics). These personal notes are scoped to the selected member via the member picker, not access-controlled (no auth in MVP).

---

## Data Model

New `member_song_notes` table:
- `id` (PK)
- `member_id` (FK → members, not null)
- `setlist_song_id` (FK → setlist_songs, not null)
- `note` (text, not null)
- `created_at`, `updated_at` (timestamps)
- Unique index on `(member_id, setlist_song_id)`

**Model associations:**
- `MemberSongNote` belongs_to `:member` and `:setlist_song`
- `Member` has_many `:member_song_notes`, dependent: `:destroy`
- `SetlistSong` has_many `:member_song_notes`, dependent: `:destroy`

**Validations:**
- Presence of `note`, `member_id`, `setlist_song_id`
- Uniqueness of `member_id` scoped to `setlist_song_id`

The existing `free_text_notes` on `SongPerformanceConfig` stays as shared notes.

---

## Member Picker

A global member-picker dropdown, always visible in the app header:
- Populated from `BandContext`'s `band.members` list (no separate fetch).
- Selection persisted to `localStorage` under a key like `setlister_member_id_${bandId}` (scoped to band so switching bands doesn't produce stale selections).
- New `MemberContext` wraps the app inside `BandProvider` in `_app.tsx`, consuming `BandContext` to access the members list.
- `MemberContext` exposes `currentMember: Member | null` and `setCurrentMember: (member: Member | null) => void`.
- Default state: no member selected.
- **Stale member recovery:** On load, if the stored `member_id` is not found in `band.members`, reset to null (clear localStorage value).
- **Band loading state:** `MemberContext` waits for `BandContext` to finish loading before resolving `currentMember` from localStorage. While band is loading, `currentMember` is null.

**Layout:** A new `AppLayout` component wraps all pages, rendered in `_app.tsx` inside the providers. It renders a persistent top bar with the member picker. This is separate from `EditorLayout`'s own header (which has the setlist name, Save/Cancel buttons, Back link). `AppLayout` sits above page-level layouts — the editor page would show `AppLayout` top bar, then `EditorLayout` header below it.

---

## API

### Endpoints

**`GET /api/member_song_notes?setlist_id=X&member_id=Y`**
- Returns all notes for a member across a setlist.
- Response: `[{ id, setlist_song_id, note }]`
- Scoped by joining through `setlist_songs` to filter by `setlist_id`.

**`POST /api/member_song_notes`**
- Body: `{ member_song_note: { member_id, setlist_song_id, note } }`
- Upserts: finds by `(member_id, setlist_song_id)`, creates or updates.
- If `note` is empty string: deletes the record and returns `204 No Content`.
- Otherwise returns the upserted record as JSON with `200`.

### Routing

```ruby
namespace :api do
  get 'member_song_notes', to: 'member_song_notes#index'
  post 'member_song_notes', to: 'member_song_notes#upsert'
end
```

---

## Frontend

### Types

New interfaces in `frontend/lib/types.ts`:
```typescript
export interface MemberSongNote {
  id: number;
  setlist_song_id: number;
  note: string;
}

// Request type for upsert (includes member_id)
export interface MemberSongNoteUpsert {
  member_id: number;
  setlist_song_id: number;
  note: string;
}
```

### API Client

New `memberSongNotes` namespace in `frontend/lib/api.ts`:
- `list(setlistId: number, memberId: number)` → `GET /api/member_song_notes?setlist_id=X&member_id=Y`
- `upsert(data: MemberSongNoteUpsert)` → `POST /api/member_song_notes`

### Data Flow

1. `EditorLayout` fetches member notes on mount when `currentMember` is set, via `api.memberSongNotes.list(setlistId, currentMember.id)`.
2. Notes are stored in a `Record<number, string>` keyed by `setlist_song_id` (a map from setlist song ID to note text).
3. When `currentMember` changes, cancel any pending debounced saves, then refetch notes for the new member.
4. Individual note state is managed locally in the `MemberNoteTextarea` component, with autosave calling the upsert endpoint.
5. Member notes only apply to persisted setlist songs (server-assigned IDs). Newly added songs (with temp IDs from `Date.now()`) won't show the "My Notes" textarea until saved.

### Expanded Song Card

- "My Notes" textarea appears below the existing shared "Notes" textarea when a member is selected.
- If no member is selected, the "My Notes" section is hidden.
- Label: "My Notes" (or "{member.name}'s Notes").

### Autosave Behavior

Member notes save independently from the main editor Save button:
- Debounced autosave: fires 1 second after the last keystroke.
- Also saves on blur (if changed since last save).
- Cancel pending debounced saves on member change or component unmount.
- No dirty state tracking or interaction with the bulk save flow.
- Save indicator: subtle "Saved" text that fades after ~2 seconds.
- On error: show "Save failed" indicator in red. No retry — user can re-edit to trigger another save.

---

## Out of Scope

- Real authentication (MVP uses the member-picker dropdown).
- Cross-band validation (single band MVP).
- Per-member field visibility customization (deferred to performance mode).
- Member notes in performance mode (will be added when performance mode is built).
