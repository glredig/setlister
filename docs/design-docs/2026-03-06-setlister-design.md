# Setlister Design Document

## Overview

Setlister is a web app for bands to create, manage, and perform setlists. Built for a single band first, architected for multi-band use. The band's repertoire (songs they know and play) is the core data model.

Two project phases: creation/editing (priority), then performance mode.

## Tech Stack

- **Frontend:** Next.js (Pages Router) + styled-components
- **Backend:** Rails API-mode + PostgreSQL
- **Drag-and-drop:** dnd-kit
- **Charts:** Recharts
- **Infrastructure:** Heroku (shared Postgres instance with existing marketing site)

## Data Model

### Band
- name
- has_many members

### Member
- name
- instruments (array: guitar, keys, bass, drums, vocals)
- role (band_member | engineer)
- belongs_to band

### Song
- title, artist, tempo (BPM), key, time_signature, duration
- Extensible columns (existing marketing site schema)
- Scoped to band (shared table, read-only from marketing site DB)

### Setlist
- name, date, notes
- belongs_to band
- has_many setlist_songs

### SetlistSong
- belongs_to setlist, belongs_to song
- position (integer, for ordering)
- has_one song_performance_config

### SongPerformanceConfig
- belongs_to setlist_song
- lead_vocalist (member_id)
- backup_vocalists (array of member_ids)
- guitar_solo (member_id, nullable)
- instrument_overrides (JSON: member_id -> instrument for swaps)
- free_text_notes (text)

Performance config lives on SetlistSong, not Song. The same song can have different arrangements in different setlists.

## Frontend Architecture

### Pages
- `/` — Dashboard: list of setlists, create new
- `/setlists/:id/edit` — Two-panel editor
- `/setlists/:id/perform` — Performance mode (Phase 2)

### Two-Panel Editor Layout

```
+-------------------------+--------------------------+
|  REPERTOIRE             |  SETLIST                 |
|  [Search/Filter]        |  1. Song A    [drag] ... |
|  Song X           [+]  |     Lead: Mike            |
|  Song Y           [+]  |  2. Song B    [drag] ... |
|  Song Z           [+]  |     Lead: Sarah           |
|                         +--------------------------+
|                         |  TEMPO ARC GRAPH         |
|                         |  (line chart)            |
+-------------------------+--------------------------+
```

- **Left panel:** Repertoire list with search/typeahead filter at top. Click + or drag to add.
- **Right panel (top):** Ordered setlist. Draggable for reordering via dnd-kit.
- **Right panel (bottom):** Tempo arc line chart (Recharts). X = song position, Y = BPM. Updates in real-time on reorder.

### Song Cards

**Collapsed (default):** One line — title, tempo, key, vocal assignments.

**Expanded (click to toggle):**
- Lead Vocalist dropdown
- Backup Vocals multi-select
- Guitar Solo dropdown (nullable)
- Instrument Swaps (per-member override)
- Free-text Notes area

All dropdowns populated from band config. When a card is expanded, the next song's collapsed card must always remain visible (scroll or max-height constraint).

### State Management
- React state + context. No Redux.
- Explicit save button (no autosave).

## API Design

### Band & Members
- `GET /api/bands/:id` — band with members
- `PUT /api/bands/:id` — update band
- `POST /api/bands/:id/members` — add member
- `PUT /api/members/:id` — update member
- `DELETE /api/members/:id` — remove member

### Repertoire
- `GET /api/bands/:id/songs` — full repertoire (params: ?q=, ?key=, ?tempo_min=)
- `POST /api/bands/:id/songs` — add song
- `PUT /api/songs/:id` — update song
- `DELETE /api/songs/:id` — remove song

### Setlists
- `GET /api/bands/:id/setlists` — list setlists
- `POST /api/bands/:id/setlists` — create setlist
- `GET /api/setlists/:id` — full setlist (songs, positions, performance configs)
- `PUT /api/setlists/:id` — update setlist metadata
- `DELETE /api/setlists/:id` — delete setlist

### Setlist Songs
- `PUT /api/setlists/:id/songs` — bulk update (full ordered list with positions and performance configs in one call)

### Auth
Deferred. Phase 1 assumes single band. Multi-band will add API key or session-based auth.

## Repertoire Sync Strategy

Shared Heroku Postgres instance. Setlister reads the marketing site's existing songs table read-only. Setlister owns its own tables (bands, members, setlists, setlist_songs, song_performance_configs).

When multi-band becomes necessary, migrate to a dedicated songs table with an import endpoint.

## Phase 2 — Performance Mode (Future)

- Performance view at `/setlists/:id/perform`
- Per-member field customization (each member toggles which fields they see)
- Sound engineer view (same data, different default visibility)
- Visual metronome (subtle pulsing element based on song BPM)
- Dark mode / theme options
- Manual song advance (tap/click to next song)

## Band Context

- 4 band members: 3 trade lead/backup vocals, 2 guitarists (sometimes play keys), bassist, drummer
- 1 sound engineer
- Existing marketing site: Rails + PostgreSQL on Heroku with songs table
