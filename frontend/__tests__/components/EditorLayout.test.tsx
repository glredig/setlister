import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { EditorLayout } from '@/components/Editor/EditorLayout';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockSetlistDetail = {
  id: 1,
  name: 'Friday Night Set',
  date: '2026-03-20',
  notes: '',
  setlist_songs: [
    {
      id: 10,
      position: 1,
      song: { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
      song_performance_config: { id: 100, lead_vocalist_ids: [], backup_vocalist_ids: [], solos: [], instrument_overrides: {}, free_text_notes: '' },
    },
  ],
};

const mockSongs = [
  { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
  { id: 2, title: 'Song B', artist: 'Artist B', tempo: 140, key: 'G', time_signature: '4/4', duration: 200 },
  { id: 3, title: 'Song C', artist: 'Artist C', tempo: 100, key: 'Am', time_signature: '3/4', duration: 180 },
];

describe('EditorLayout', () => {
  beforeEach(() => {
    mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
    mockedApi.songs.list.mockResolvedValue(mockSongs);
  });

  it('renders both panels with setlist name', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={[]} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
    });
    // Repertoire panel shows available songs
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={[]} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
