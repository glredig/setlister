# Frontend Phase A: Scaffold + Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use frontend-dev-loop skill for visual verification with agent-browser.

**Goal:** Scaffold the Next.js frontend and build the setlist dashboard page — list existing setlists, create new ones, delete setlists.

**Architecture:** Next.js (Pages Router) with styled-components, calling the Rails API on port 3001. React context for band data. No barrel files — import directly from source files.

**Tech Stack:** Next.js 14, styled-components, TypeScript, React Testing Library, Jest

**API Base URL (dev):** `http://localhost:3001`

**Prerequisite:** Rails backend running on port 3001 with seed data (`cd backend && rails db:seed && rails server -p 3001`)

---

### Task 1: Scaffold Next.js App

**Files:**
- Create: `frontend/` (new Next.js app)

**Step 1: Generate Next.js app with Pages Router**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister
npx create-next-app@latest frontend --typescript --no-tailwind --no-eslint --no-app --no-src-dir --import-alias "@/*" --yes
```

Note: `--no-app` uses Pages Router (not App Router). This avoids styled-components SSR complexity.

**Step 2: Install styled-components**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend
npm install styled-components
npm install --save-dev @types/styled-components
```

**Step 3: Configure styled-components for Next.js**

Create `frontend/pages/_document.tsx`:

```tsx
import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElements()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
```

**Step 4: Add styled-components compiler config**

Modify `frontend/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
```

**Step 5: Verify it runs**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend
npm run dev &
```

Then verify with agent-browser:
```bash
agent-browser open http://localhost:3000 && agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot docs/screenshots/scaffold-initial.png
agent-browser close
kill $(lsof -t -i:3000) 2>/dev/null
```

Expected: Default Next.js welcome page renders.

**Step 6: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: scaffold Next.js frontend with styled-components"
```

---

### Task 2: API Client Module

**Files:**
- Create: `frontend/lib/api.ts`
- Create: `frontend/lib/types.ts`
- Create: `frontend/__tests__/lib/api.test.ts`

**Step 1: Define TypeScript types**

Create `frontend/lib/types.ts`:

```ts
export interface Member {
  id: number;
  name: string;
  instruments: string[];
  role: 'band_member' | 'engineer';
}

export interface Band {
  id: number;
  name: string;
  members: Member[];
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  tempo: number;
  key: string;
  time_signature: string;
  duration: number;
}

export interface SongPerformanceConfig {
  id: number;
  lead_vocalist_id: number | null;
  backup_vocalist_ids: number[];
  guitar_solo_id: number | null;
  instrument_overrides: Record<string, string>;
  free_text_notes: string;
}

export interface SetlistSong {
  id: number;
  position: number;
  song: Song;
  song_performance_config: SongPerformanceConfig;
}

export interface Setlist {
  id: number;
  name: string;
  date: string;
  notes: string;
}

export interface SetlistDetail extends Setlist {
  setlist_songs: SetlistSong[];
}
```

**Step 2: Create API client**

Create `frontend/lib/api.ts`:

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.errors?.join(', ') || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  bands: {
    get: (id: number) => request<import('./types').Band>(`/api/bands/${id}`),
  },

  setlists: {
    list: (bandId: number) => request<import('./types').Setlist[]>(`/api/bands/${bandId}/setlists`),
    get: (id: number) => request<import('./types').SetlistDetail>(`/api/setlists/${id}`),
    create: (bandId: number, data: { name: string; date: string; notes?: string }) =>
      request<import('./types').Setlist>(`/api/bands/${bandId}/setlists`, {
        method: 'POST',
        body: JSON.stringify({ setlist: data }),
      }),
    update: (id: number, data: Partial<{ name: string; date: string; notes: string }>) =>
      request<import('./types').Setlist>(`/api/setlists/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ setlist: data }),
      }),
    delete: (id: number) => request<void>(`/api/setlists/${id}`, { method: 'DELETE' }),
  },

  songs: {
    list: (bandId: number, params?: { q?: string; key?: string; tempo_min?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.key) searchParams.set('key', params.key);
      if (params?.tempo_min) searchParams.set('tempo_min', String(params.tempo_min));
      const qs = searchParams.toString();
      return request<import('./types').Song[]>(`/api/bands/${bandId}/songs${qs ? `?${qs}` : ''}`);
    },
  },
};
```

**Step 3: Write tests**

Install test deps:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @types/jest ts-jest jest-environment-jsdom
```

Create `frontend/jest.config.ts`:

```ts
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default config;
```

Add to `frontend/package.json` scripts:
```json
"test": "jest",
"test:watch": "jest --watch"
```

Create `frontend/__tests__/lib/api.test.ts`:

```ts
import { api } from '@/lib/api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

describe('api.setlists', () => {
  it('list fetches setlists for a band', async () => {
    const setlists = [{ id: 1, name: 'Friday Set', date: '2026-03-20', notes: '' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(setlists),
    });

    const result = await api.setlists.list(1);
    expect(result).toEqual(setlists);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/bands/1/setlists',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    );
  });

  it('create sends POST with setlist data', async () => {
    const newSetlist = { id: 2, name: 'New Set', date: '2026-04-01', notes: '' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(newSetlist),
    });

    const result = await api.setlists.create(1, { name: 'New Set', date: '2026-04-01' });
    expect(result).toEqual(newSetlist);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/bands/1/setlists',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ setlist: { name: 'New Set', date: '2026-04-01' } }),
      })
    );
  });

  it('delete sends DELETE request', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

    await api.setlists.delete(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/setlists/1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('throws on error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'Record not found' }),
    });

    await expect(api.setlists.get(999)).rejects.toThrow('Record not found');
  });
});
```

**Step 4: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 5: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add API client with types and tests"
```

---

### Task 3: Band Context Provider

**Files:**
- Create: `frontend/contexts/BandContext.tsx`
- Create: `frontend/__tests__/contexts/BandContext.test.tsx`

**Step 1: Write the test**

Create `frontend/__tests__/contexts/BandContext.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BandProvider, useBand } from '@/contexts/BandContext';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

function TestConsumer() {
  const { band, loading } = useBand();
  if (loading) return <div>Loading...</div>;
  if (!band) return <div>No band</div>;
  return (
    <div>
      <span data-testid="band-name">{band.name}</span>
      <span data-testid="member-count">{band.members.length}</span>
    </div>
  );
}

describe('BandContext', () => {
  it('provides band data after loading', async () => {
    mockedApi.bands.get.mockResolvedValueOnce({
      id: 1,
      name: 'The Originals',
      members: [
        { id: 1, name: 'Mike', instruments: ['guitar'], role: 'band_member' },
        { id: 2, name: 'Sarah', instruments: ['guitar'], role: 'band_member' },
      ],
    });

    render(
      <BandProvider bandId={1}>
        <TestConsumer />
      </BandProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('band-name')).toHaveTextContent('The Originals');
      expect(screen.getByTestId('member-count')).toHaveTextContent('2');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL — module not found.

**Step 3: Implement the context**

Create `frontend/contexts/BandContext.tsx`:

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { Band } from '@/lib/types';

interface BandContextValue {
  band: Band | null;
  loading: boolean;
  error: string | null;
}

const BandContext = createContext<BandContextValue>({
  band: null,
  loading: true,
  error: null,
});

export function BandProvider({ bandId, children }: { bandId: number; children: ReactNode }) {
  const [band, setBand] = useState<Band | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.bands.get(bandId)
      .then(setBand)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bandId]);

  return (
    <BandContext.Provider value={{ band, loading, error }}>
      {children}
    </BandContext.Provider>
  );
}

export function useBand() {
  return useContext(BandContext);
}
```

**Step 4: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 5: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add BandContext provider for shared band data"
```

---

### Task 4: Global Layout and Theme

**Files:**
- Create: `frontend/styles/theme.ts`
- Create: `frontend/styles/GlobalStyle.ts`
- Modify: `frontend/pages/_app.tsx`

**Step 1: Create theme**

Create `frontend/styles/theme.ts`:

```ts
export const theme = {
  colors: {
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceLight: '#0f3460',
    primary: '#e94560',
    text: '#eee',
    textMuted: '#aaa',
    border: '#333',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'SFMono-Regular, Menlo, monospace',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

export type Theme = typeof theme;
```

**Step 2: Create global styles**

Create `frontend/styles/GlobalStyle.ts`:

```ts
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.body};
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
  }

  a {
    color: inherit;
    text-decoration: none;
  }
`;
```

**Step 3: Create styled.d.ts for theme typing**

Create `frontend/styles/styled.d.ts`:

```ts
import 'styled-components';
import { Theme } from './theme';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
```

**Step 4: Update _app.tsx**

Replace `frontend/pages/_app.tsx`:

```tsx
import type { AppProps } from 'next/app';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { BandProvider } from '@/contexts/BandContext';

const BAND_ID = Number(process.env.NEXT_PUBLIC_BAND_ID) || 1;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BandProvider bandId={BAND_ID}>
        <Component {...pageProps} />
      </BandProvider>
    </ThemeProvider>
  );
}
```

**Step 5: Verify visually with agent-browser**

Start backend and frontend:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend && rails server -p 3001 &
cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm run dev &
```

Verify:
```bash
agent-browser open http://localhost:3000 && agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot docs/screenshots/theme-initial.png
```

Expected: Dark background, light text. Default Next.js content with theme applied.

**Step 6: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add theme, global styles, and BandProvider to app layout"
```

---

### Task 5: Dashboard Page — List Setlists

**Files:**
- Create: `frontend/pages/index.tsx`
- Create: `frontend/components/Dashboard/Dashboard.tsx`
- Create: `frontend/components/Dashboard/SetlistCard.tsx`
- Create: `frontend/__tests__/components/Dashboard.test.tsx`

**Step 1: Write the test**

Create `frontend/__tests__/components/Dashboard.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Dashboard', () => {
  it('renders setlist cards', async () => {
    mockedApi.setlists.list.mockResolvedValueOnce([
      { id: 1, name: 'Friday Night Set', date: '2026-03-20', notes: 'Opening night' },
      { id: 2, name: 'Saturday Matinee', date: '2026-03-21', notes: '' },
    ]);

    renderWithTheme(<Dashboard bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
      expect(screen.getByText('Saturday Matinee')).toBeInTheDocument();
    });
  });

  it('shows empty state when no setlists', async () => {
    mockedApi.setlists.list.mockResolvedValueOnce([]);

    renderWithTheme(<Dashboard bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/no setlists/i)).toBeInTheDocument();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL

**Step 3: Implement SetlistCard**

Create `frontend/components/Dashboard/SetlistCard.tsx`:

```tsx
import styled from 'styled-components';
import { Setlist } from '@/lib/types';

interface SetlistCardProps {
  setlist: Setlist;
  onDelete: (id: number) => void;
}

export function SetlistCard({ setlist, onDelete }: SetlistCardProps) {
  const formattedDate = new Date(setlist.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card>
      <CardBody href={`/setlists/${setlist.id}/edit`}>
        <SetlistName>{setlist.name}</SetlistName>
        <SetlistDate>{formattedDate}</SetlistDate>
        {setlist.notes && <SetlistNotes>{setlist.notes}</SetlistNotes>}
      </CardBody>
      <DeleteButton onClick={() => onDelete(setlist.id)} aria-label={`Delete ${setlist.name}`}>
        &times;
      </DeleteButton>
    </Card>
  );
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: border-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const CardBody = styled.a`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  display: block;
`;

const SetlistName = styled.h3`
  font-size: 1.1rem;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SetlistDate = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const SetlistNotes = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
```

**Step 4: Implement Dashboard**

Create `frontend/components/Dashboard/Dashboard.tsx`:

```tsx
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { api } from '@/lib/api';
import { Setlist } from '@/lib/types';
import { SetlistCard } from '@/components/Dashboard/SetlistCard';

interface DashboardProps {
  bandId: number;
}

export function Dashboard({ bandId }: DashboardProps) {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.setlists.list(bandId)
      .then(setSetlists)
      .finally(() => setLoading(false));
  }, [bandId]);

  const handleDelete = async (id: number) => {
    await api.setlists.delete(id);
    setSetlists((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) return <Container><p>Loading...</p></Container>;

  return (
    <Container>
      <Header>
        <h1>Setlists</h1>
      </Header>
      {setlists.length === 0 ? (
        <EmptyState>No setlists yet. Create your first one!</EmptyState>
      ) : (
        <SetlistGrid>
          {setlists.map((setlist) => (
            <SetlistCard key={setlist.id} setlist={setlist} onDelete={handleDelete} />
          ))}
        </SetlistGrid>
      )}
    </Container>
  );
}

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const EmptyState = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xl};
`;

const SetlistGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;
```

**Step 5: Wire up the page**

Replace `frontend/pages/index.tsx`:

```tsx
import { useBand } from '@/contexts/BandContext';
import { Dashboard } from '@/components/Dashboard/Dashboard';

export default function Home() {
  const { band, loading } = useBand();

  if (loading || !band) return null;

  return <Dashboard bandId={band.id} />;
}
```

**Step 6: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 7: Verify visually with agent-browser**

```bash
agent-browser open http://localhost:3000 && agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot docs/screenshots/dashboard-v1.png
```

Expected: Dark themed page with "Setlists" heading and the "Friday Night Set" card from seed data.

**Step 8: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add dashboard page with setlist cards"
```

---

### Task 6: Create Setlist Modal

**Files:**
- Create: `frontend/components/Dashboard/CreateSetlistModal.tsx`
- Create: `frontend/__tests__/components/CreateSetlistModal.test.tsx`
- Modify: `frontend/components/Dashboard/Dashboard.tsx`

**Step 1: Write the test**

Create `frontend/__tests__/components/CreateSetlistModal.test.tsx`:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { CreateSetlistModal } from '@/components/Dashboard/CreateSetlistModal';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('CreateSetlistModal', () => {
  it('calls onCreate with form data', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    renderWithTheme(
      <CreateSetlistModal isOpen={true} onClose={onClose} onCreate={onCreate} />
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Set' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-04-01' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({ name: 'New Set', date: '2026-04-01' });
    });
  });

  it('does not render when closed', () => {
    renderWithTheme(
      <CreateSetlistModal isOpen={false} onClose={jest.fn()} onCreate={jest.fn()} />
    );

    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: FAIL

**Step 3: Implement the modal**

Create `frontend/components/Dashboard/CreateSetlistModal.tsx`:

```tsx
import { useState } from 'react';
import styled from 'styled-components';

interface CreateSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; date: string }) => Promise<void>;
}

export function CreateSetlistModal({ isOpen, onClose, onCreate }: CreateSetlistModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({ name, date });
    setName('');
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <h2>New Setlist</h2>
        <Form onSubmit={handleSubmit}>
          <Label>
            Name
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Label>
          <Label>
            Date
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Label>
          <ButtonRow>
            <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
            <CreateButton type="submit">Create</CreateButton>
          </ButtonRow>
        </Form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.xl};
  width: 400px;
  max-width: 90vw;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Input = styled.input`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const CancelButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  cursor: pointer;
`;

const CreateButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 4px;
  color: white;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  cursor: pointer;
  font-weight: bold;
`;
```

**Step 4: Add create button and modal to Dashboard**

Modify `frontend/components/Dashboard/Dashboard.tsx` — add imports and state at the top of the component:

```tsx
import { CreateSetlistModal } from '@/components/Dashboard/CreateSetlistModal';

// Inside the Dashboard component, add:
const [showCreate, setShowCreate] = useState(false);

const handleCreate = async (data: { name: string; date: string }) => {
  const newSetlist = await api.setlists.create(bandId, data);
  setSetlists((prev) => [newSetlist, ...prev]);
};
```

Add to the Header section:
```tsx
<Header>
  <h1>Setlists</h1>
  <CreateButton onClick={() => setShowCreate(true)}>+ New Setlist</CreateButton>
</Header>
```

Add modal before closing Container tag:
```tsx
<CreateSetlistModal
  isOpen={showCreate}
  onClose={() => setShowCreate(false)}
  onCreate={handleCreate}
/>
```

Add the styled CreateButton:
```tsx
const CreateButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 4px;
  color: white;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  cursor: pointer;
  font-weight: bold;
  font-size: 0.9rem;
`;
```

**Step 5: Run tests**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose`

Expected: ALL PASS

**Step 6: Verify visually with agent-browser**

```bash
agent-browser reload && agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot docs/screenshots/dashboard-with-create-button.png
agent-browser click "text=+ New Setlist"
agent-browser wait "input[type='text']"
agent-browser screenshot docs/screenshots/create-modal-open.png
```

Expected: Dashboard with "+ New Setlist" button. Modal opens with name/date fields.

**Step 7: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add frontend/
git commit -m "feat: add create setlist modal to dashboard"
```

---

### Task 7: Full Integration Verification

**Step 1: Run full test suite**

```bash
cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm test -- --verbose
```

Expected: ALL PASS

**Step 2: Start both servers and verify end-to-end**

```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend && rails server -p 3001 &
cd /Users/gabrielredig/code/react_projects/setlister/frontend && npm run dev &
```

```bash
agent-browser open http://localhost:3000 && agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot docs/screenshots/dashboard-final.png
```

Expected: Dashboard showing "Friday Night Set" from seed data, "+ New Setlist" button, dark theme.

**Step 3: Test create flow**

```bash
agent-browser click "text=+ New Setlist"
agent-browser wait "input[type='text']"
agent-browser fill "input[type='text']" "Saturday Show"
agent-browser click "text=Create"
agent-browser wait --load networkidle
agent-browser screenshot docs/screenshots/dashboard-after-create.png
```

Expected: New "Saturday Show" card appears in the dashboard.

**Step 4: Test delete flow**

```bash
agent-browser click "[aria-label='Delete Saturday Show']"
agent-browser wait --load networkidle
agent-browser screenshot docs/screenshots/dashboard-after-delete.png
```

Expected: "Saturday Show" card removed.

**Step 5: Clean up and commit screenshots**

```bash
agent-browser close
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:3001) 2>/dev/null
```

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add docs/screenshots/
git commit -m "docs: add dashboard screenshots from integration verification"
```

Phase A frontend is complete. Dashboard is functional with list, create, and delete.
