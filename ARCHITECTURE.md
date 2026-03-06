# Architecture

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐
│  Next.js     │────▶│  Rails API   │────▶│  PostgreSQL    │
│  Frontend    │ JSON│  (port 3001) │     │  (Heroku)      │
│  (port 3000) │◀────│              │◀────│                │
└─────────────┘     └──────────────┘     └────────────────┘
                                               ▲
                                               │ shared DB
                                         ┌─────┴──────┐
                                         │  Marketing  │
                                         │  Site       │
                                         └────────────┘
```

Two apps share a Heroku Postgres instance. The marketing site owns the `songs` table. Setlister reads it and owns all other tables (bands, members, setlists, setlist_songs, song_performance_configs).

## Key Decisions

### Rails API-mode over Next.js API routes
The backend needs to be independently deployable for future multi-band use. Rails API-mode gives us a standalone, consumable API that any frontend (or third-party integration) can use. Next.js API routes would couple the backend to the frontend deployment.

### Shared Postgres over sync/import
For a single-band MVP, sharing the database avoids sync complexity. The marketing site manages the songs table; setlister reads it. When multi-band arrives, we migrate to a dedicated songs table with an import API.

### dnd-kit over React DnD
dnd-kit is lighter, better maintained, has better React 18+ support, and a simpler API. React DnD is heavier and has less active development.

### Recharts for tempo arc
Lightweight, React-native charting. No D3 complexity needed for a single line chart. Well-documented with active maintenance.

### styled-components over Tailwind
Team preference and familiarity. Using Pages Router to avoid App Router SSR complexity with styled-components.

### Bulk update over individual CRUD for setlist songs
One save button, one API call. The frontend sends the full setlist state (song order + performance configs) in a single PUT. Simpler than managing individual create/update/delete calls for each drag-and-drop or config edit.

## Data Flow

### Editing a setlist
1. Dashboard loads setlist list from `GET /api/bands/:id/setlists`
2. Editor loads full setlist from `GET /api/setlists/:id` (songs + configs)
3. Editor loads repertoire from `GET /api/bands/:id/songs`
4. User edits (reorder, add/remove songs, edit configs) in local React state
5. User clicks Save → `PUT /api/setlists/:id/songs` with full state
