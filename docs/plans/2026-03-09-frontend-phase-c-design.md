# Phase C: Performance Config Editor — Design

## Guiding Principle

Next song visibility is non-negotiable. No amount of config editing is more important than seeing what's coming next.

## What We're Building

Expandable song cards in the setlist panel. Click a card to open an inline performance config form. Accordion behavior — only one card open at a time. Auto-scroll on expand so the next song stays visible.

Future live mode will render the same config data with a compact read-only layout. Phase C only builds edit mode, but the component structure supports both via a `mode` prop.

## Schema Changes

Migration required:

- `lead_vocalist_id` (integer, nullable) → `lead_vocalist_ids` (integer array, default `[]`)
- `guitar_solo_id` (integer, nullable) → removed
- Add `solos` (jsonb, default `[]`) — array of `{ member_id: number, instrument: string }`

Update seeds, model, serializer to match.

### Updated Type

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

## Component Architecture

### SortableSetlistItem (modified)

Gains props: `expanded`, `onToggleExpand`, `onConfigChange`, `members`, `mode`.

- Click header row to expand/collapse
- When expanded in edit mode, renders `PerformanceConfigForm` below the collapsed header
- When expanded in live mode (future), renders a compact read-only view
- Both states remain within the same draggable container

### PerformanceConfigForm (new)

Stateless form component. Props: `config: SongPerformanceConfig`, `members: Member[]`, `onChange: (updated: SongPerformanceConfig) => void`.

Fields (in order):
1. **Lead Vocalists** — multi-select checkboxes of band members
2. **Backup Vocals** — checkboxes, auto-excludes current lead vocalists
3. **Solos** — repeatable rows: member dropdown + instrument dropdown + remove button. "Add solo" button to add rows.
4. **Instrument Overrides** — one dropdown per band member with 2+ instruments. Options: "Default" + their instrument list.
5. **Free-text Notes** — textarea, 2-3 rows

### SetlistPanel (modified)

Passes through: `expandedId`, `onToggleExpand`, `onConfigChange`, `members`.

### EditorLayout (modified)

New state:
- `expandedId: number | null` — which card is expanded

New handlers:
- `handleToggleExpand(id)` — accordion toggle (set or clear expandedId)
- `handleConfigChange(setlistSongId, updatedConfig)` — updates config in setlistSongs state, marks dirty

Members data: passed from page route via `useBand()` context (already loaded).

## Data Flow

1. User clicks collapsed card → `handleToggleExpand` sets `expandedId`
2. Card re-renders with `PerformanceConfigForm`
3. Auto-scroll setlist panel so expanded card is at top of visible area
4. User edits a field → `onChange` fires → `handleConfigChange` updates `setlistSongs` state, sets `isDirty = true`
5. On Save, existing `handleSave` already maps `song_performance_config` into bulk update payload — updated to use new field names

No new API endpoints. Existing `PUT /api/setlists/:id/songs` handles everything.

## Auto-Scroll Behavior

When a card expands, auto-scroll the setlist panel so the expanded card is at the top of the visible area. This guarantees the next collapsed card is visible below. No max-height or internal scrolling needed — the config form is compact enough (a few checkboxes, dropdowns, and a textarea).

## Key Decisions

- **Accordion (single expand)** — guarantees next song visibility
- **Inline expand (not overlay/portal)** — maintains spatial relationship with next song
- **Auto-scroll (not max-height)** — avoids nested scrolling, simpler UX
- **Mode prop for future live view** — only edit mode built now, but architecture supports both
- **Solos as jsonb array** — flexible enough for guitar solos, keyboard solos, or any instrument
- **Lead vocalists as integer array** — supports songs with traded lead vocals
- **Backup vocals auto-exclude leads** — prevents duplicate assignments

## Testing Strategy

- PerformanceConfigForm: field rendering, onChange callbacks, auto-remove lead from backup, solo add/remove
- EditorLayout: handleToggleExpand (accordion behavior), handleConfigChange (updates state + dirty)
- Backend: migration spec, model validation for solos structure
- Integration: expand card, edit fields, save, verify persistence
