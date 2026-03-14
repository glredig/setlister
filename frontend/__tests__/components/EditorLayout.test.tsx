import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { EditorLayout } from '@/components/Editor/EditorLayout';
import { api } from '@/lib/api';
import { MemberProvider } from '@/contexts/MemberContext';
import { BandProvider } from '@/contexts/BandContext';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

const mockBand = {
  id: 1,
  name: 'Test Band',
  members: [
    { id: 1, name: 'Mike', instruments: ['guitar'], role: 'band_member' as const },
  ],
};

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeProvider theme={theme}>
      <BandProvider bandId={1}>
        <MemberProvider>
          {ui}
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}

const mockSetlistDetail = {
  id: 1,
  name: 'Friday Night Set',
  date: '2026-03-20',
  notes: '',
  inter_song_gap_seconds: 30,
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
    localStorage.clear();
    mockedApi.bands.get.mockResolvedValue(mockBand);
    mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
    mockedApi.songs.list.mockResolvedValue(mockSongs);
    mockedApi.memberSongNotes.list.mockResolvedValue([]);
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

  it('displays the duration summary bar', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={[]} />);

    await waitFor(() => {
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });
  });

  it('renders My Notes textarea when a member is selected', async () => {
    localStorage.setItem('setlister_member_id_1', '1');
    mockedApi.memberSongNotes.list.mockResolvedValue([
      { id: 1, setlist_song_id: 10, note: 'My personal note' },
    ]);

    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={mockBand.members} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
    });

    const songAMatches = screen.getAllByText('Song A');
    fireEvent.click(songAMatches[songAMatches.length - 1]);

    await waitFor(() => {
      expect(screen.getByLabelText('My Notes')).toHaveValue('My personal note');
    });
  });
});
