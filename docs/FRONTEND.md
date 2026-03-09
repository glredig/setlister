# Frontend

## Guidelines

### No Barrel Files
Import directly from the source file, not through `index.ts` re-exports. Barrel files obscure dependency graphs, slow down builds, and make tree-shaking harder.

```tsx
// Do this
import { SongCard } from '../components/SongCard/SongCard';

// Not this
import { SongCard } from '../components';
```

### Reuse Components
Before creating a new component, check if an existing one can serve the same purpose — possibly with a prop variant. Duplication leads to inconsistent UI and wasted effort.

- Extract shared UI patterns (buttons, cards, modals, form fields) into reusable components
- Prefer a prop to control variants over a separate component (e.g. `<Button variant="primary">` not `<PrimaryButton>`)
- If two components share >80% of their structure, refactor into one

### Theme-Driven Styles
Never hardcode colors, fonts, or spacing. Always reference the theme so widespread visual changes (rebranding, dark/light mode) require editing one file.

```tsx
// Do this
color: ${({ theme }) => theme.colors.primary};
padding: ${({ theme }) => theme.spacing.md};

// Not this
color: #e94560;
padding: 16px;
```

The theme (`frontend/styles/theme.ts`) is the single source of truth for:
- **Colors** — background, surface, primary, text, border
- **Fonts** — body, mono
- **Spacing** — xs through xl

Add new tokens to the theme rather than introducing one-off values.
