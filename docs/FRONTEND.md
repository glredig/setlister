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
