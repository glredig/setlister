import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const mockMembers = [
  { id: 1, name: 'Mike', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' as const },
  { id: 2, name: 'Sarah', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' as const },
  { id: 3, name: 'Jake', instruments: ['bass', 'vocals'], role: 'band_member' as const },
  { id: 4, name: 'Dave', instruments: ['drums'], role: 'band_member' as const },
  { id: 5, name: 'Chris', instruments: [], role: 'engineer' as const },
];

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
    {
      id: 11,
      position: 2,
      song: { id: 2, title: 'Song B', artist: 'Artist B', tempo: 140, key: 'G', time_signature: '4/4', duration: 200 },
      song_performance_config: { id: 101, lead_vocalist_ids: [], backup_vocalist_ids: [], solos: [], instrument_overrides: {}, free_text_notes: '' },
    },
  ],
};

const mockSongs = [
  { id: 1, title: 'Song A', artist: 'Artist A', tempo: 120, key: 'C', time_signature: '4/4', duration: 240 },
  { id: 2, title: 'Song B', artist: 'Artist B', tempo: 140, key: 'G', time_signature: '4/4', duration: 200 },
];

// Helper to get the setlist panel song title (not the repertoire panel one)
// Songs appear in both panels; the setlist item's title is inside a CollapsedRow
// which has a specific structure. We use getAllByText and pick the last match
// since the setlist panel renders after the repertoire panel.
function getSetlistSongTitle(title: string) {
  const matches = screen.getAllByText(title);
  // Last match is in the setlist panel
  return matches[matches.length - 1];
}

describe('Editor expand/collapse', () => {
  beforeEach(() => {
    mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
    mockedApi.songs.list.mockResolvedValue(mockSongs);
  });

  it('expands a song card when clicked', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getAllByText('Song A').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(getSetlistSongTitle('Song A'));

    expect(screen.getByText('Lead Vocalists')).toBeInTheDocument();
  });

  it('collapses expanded card when clicked again', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getAllByText('Song A').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(getSetlistSongTitle('Song A'));
    expect(screen.getByText('Lead Vocalists')).toBeInTheDocument();

    fireEvent.click(getSetlistSongTitle('Song A'));
    expect(screen.queryByText('Lead Vocalists')).not.toBeInTheDocument();
  });

  it('only one card is expanded at a time (accordion)', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} members={mockMembers} />);

    await waitFor(() => {
      expect(screen.getAllByText('Song A').length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(getSetlistSongTitle('Song A'));
    expect(screen.getByText('Lead Vocalists')).toBeInTheDocument();

    fireEvent.click(getSetlistSongTitle('Song B'));
    // Only one "Lead Vocalists" label should exist (Song B's form)
    expect(screen.getAllByText('Lead Vocalists')).toHaveLength(1);
  });
});
