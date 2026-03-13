# Per-Member Notes Design

**Goal:** Allow each band member to have their own private notes on each song in a setlist, alongside the existing shared notes.

**Context:** The current `free_text_notes` field on `SongPerformanceConfig` is shared — visible to all members. Different band members need different reminders per song (e.g., a guitarist's note about a riff vs. a vocalist's note about lyrics).

---

## Data Model

New `member_song_notes` table:
- `id` (PK)
- `member_id` (FK → members)
- `setlist_song_id` (FK → setlist_songs)
- `note` (text)
- Unique constraint on `(member_id, setlist_song_id)`

The existing `free_text_notes` on `SongPerformanceConfig` stays as shared master notes.

---

## Member Picker

A global member-picker dropdown, always visible in the app header:
- Populated from the band's members list (fetched via API).
- Selection persisted to `localStorage`.
- React context (`MemberContext`) exposes `currentMember` to all components.
- Default state: no member selected.

The member picker lives at the layout level so it's available on every page. This keeps it consistent and future-proofs for any other per-member features.

---

## API

Two new endpoints scoped to member notes:

- `GET /api/member_song_notes?setlist_id=X&member_id=Y` — returns all notes for a member across a setlist.
- `PUT /api/member_song_notes` with `{ member_id, setlist_song_id, note }` — upserts a single note (creates if new, updates if exists).

Member notes are fetched separately from the setlist detail response to keep concerns clean. The setlist detail endpoint is unchanged.

---

## Frontend

### Expanded Song Card

- A "My Notes" textarea appears below the existing shared "Notes" textarea when a member is selected.
- If no member is selected, the "My Notes" section is hidden (or shows a prompt to select a member).

### Autosave Behavior

Member notes save independently from the main editor Save button:
- Debounced autosave: saves 1 second after the last keystroke.
- Also saves on blur.
- No dirty state tracking or interaction with the bulk save flow.
- Subtle save indicator (e.g., "Saved" text that fades) to confirm the save succeeded.

---

## Out of Scope

- Real authentication (MVP uses the member-picker dropdown).
- Per-member field visibility customization (deferred to performance mode).
- Member notes in performance mode (will be added when performance mode is built).
