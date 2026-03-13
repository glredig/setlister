# Editor Enhancements Design

**Goal:** Extend the setlist editor with per-member notes, duration tracking, multi-set shows, and spacer items.

**Context:** Phase 1 (dashboard, editor, performance config) is complete. These enhancements build on the existing editor before moving to performance mode.

---

## Feature 1: Per-Member Notes

### Problem

The current `free_text_notes` field on `SongPerformanceConfig` is shared — one set of notes visible to all members. Different band members need different reminders per song (e.g., a guitarist's note about a riff vs. a vocalist's note about lyrics).

### Design

**Data model:**
- New `member_song_notes` table:
  - `id` (PK)
  - `member_id` (FK → members)
  - `setlist_song_id` (FK → setlist_songs)
  - `note` (text)
  - Unique constraint on `(member_id, setlist_song_id)`
- Existing `free_text_notes` on `SongPerformanceConfig` stays as shared master notes.

**Member identity (no auth for MVP):**
- Member-picker dropdown in the app header/nav area.
- Selection persisted to localStorage.
- `BandContext` exposes `currentMember` based on the stored selection.

**API:**
- Setlist detail response includes member notes for the current member, scoped by `member_id` query param.
- Member notes saved via the existing bulk update endpoint or a lightweight side-save.

**Frontend:**
- Expanded song card shows two textareas: "Notes" (shared master) and "My Notes" (per-member, scoped to `currentMember`).
- Available in both edit mode and performance mode.

---

## Feature 2: Setlist Duration

### Problem

Bands often play within time constraints (venue curfews, festival slots). There's no way to see how long a setlist will run.

### Design

**Data model:**
- Add `inter_song_gap_seconds` (integer, default 30) to `Setlist`.
- Song `duration` (integer, seconds) already exists on the `Song` model.

**Calculation:**
- Total = sum of song durations + sum of spacer durations + (gap × number of transitions between songs)
- Transitions = number of adjacent song pairs (spacers don't add gaps — they have their own explicit duration).

**Frontend (edit mode):**
- Duration summary bar in the setlist panel (e.g., top or near save button).
- Displays formatted total time (e.g., "1h 23m").
- Adjustable gap input (labeled "Time between songs") — changes update the total in real-time.
- Total updates live as songs are added, removed, or reordered.

**API:**
- `inter_song_gap_seconds` included in setlist create/update endpoints.

---

## Feature 3: Shows (Multi-Set Grouping)

### Problem

A gig often has multiple sets with breaks between them. Currently each setlist is standalone with no way to group them into a single event.

### Design

**Data model:**
- New `Show` model:
  - `id` (PK)
  - `band_id` (FK → bands)
  - `name` (string)
  - `date` (date)
  - `notes` (text, nullable)
- Add `show_id` (nullable FK → shows) and `show_position` (integer, nullable) to `Setlist`.
- A Show has many Setlists, ordered by `show_position`.
- Setlists can exist standalone (show_id = null) or within a show.

**API:**
- `GET/POST /api/bands/:band_id/shows` — list and create shows.
- `GET/PUT/DELETE /api/shows/:id` — show detail with nested setlists.
- `PUT /api/shows/:id/setlists` — reorder/assign setlists within a show.

**Frontend:**
- Dashboard displays both standalone setlists and shows.
- Show card expands to list its sets in order.
- Create show flow: name/date, then add or create sets within it.
- Each set links to the existing setlist editor.

---

## Feature 4: Spacer Items

### Problem

Bands need to mark non-song moments in a setlist — announcements, backing track intros, costume changes, breaks. These need to be positioned within the song order and optionally counted toward total time.

### Design

**Data model (Option A — extend SetlistSong):**
- Add to `SetlistSong`:
  - `item_type` (string, default `'song'`) — either `'song'` or `'spacer'`
  - `spacer_label` (string, nullable) — display text for spacers (e.g., "Announcement", "Backing Track: Intro")
  - `spacer_duration` (integer, nullable) — duration in seconds, optional
- When `item_type = 'spacer'`: `song_id` is null, `song_performance_config` is not created.
- When `item_type = 'song'`: `spacer_label` and `spacer_duration` are null (existing behavior).

**Frontend (edit mode):**
- "Add Spacer" button in the setlist panel (alongside or below the song list).
- Spacer items render as a visually distinct card (different styling from song cards).
- Spacers show their label and optional duration.
- Drag-and-droppable within the setlist, just like songs.
- Spacer duration counts toward total setlist time (Feature 2).
- Clicking a spacer allows editing its label and duration inline.

**API:**
- Spacers included in the bulk update payload with `item_type: 'spacer'`.
- Backend skips performance config creation for spacer items.

---

## Implementation Priority

These features are relatively independent and can be built in any order. Suggested sequence based on complexity and dependencies:

1. **Setlist Duration** — smallest scope, no new tables, immediate value
2. **Spacer Items** — extends existing SetlistSong model, integrates with duration
3. **Per-Member Notes** — new table + member picker, moderate scope
4. **Shows** — new model + dashboard changes, largest scope

---

## Out of Scope

- Real authentication (MVP uses member-picker dropdown)
- Per-member field visibility customization (deferred to performance mode)
- Set break timers or countdown clocks
- Automatic set balancing (splitting songs across sets by duration)
