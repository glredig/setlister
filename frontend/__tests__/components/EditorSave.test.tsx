import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { EditorLayout } from '@/components/Editor/EditorLayout';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn(), query: { id: '1' } }),
}));

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
];

describe('Editor save/cancel', () => {
  beforeEach(() => {
    mockedApi.setlists.get.mockResolvedValue(mockSetlistDetail);
    mockedApi.songs.list.mockResolvedValue(mockSongs);
  });

  it('calls bulkUpdate on save', async () => {
    mockedApi.setlistSongs.bulkUpdate.mockResolvedValue({
      ...mockSetlistDetail,
      setlist_songs: [
        ...mockSetlistDetail.setlist_songs,
        {
          id: 11,
          position: 2,
          song: mockSongs[1],
          song_performance_config: { id: 101, lead_vocalist_ids: [], backup_vocalist_ids: [], solos: [], instrument_overrides: {}, free_text_notes: '' },
        },
      ],
    });

    renderWithTheme(<EditorLayout setlistId={1} bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
    });

    // Add Song B to make the editor dirty
    fireEvent.click(screen.getByRole('button', { name: /add song b/i }));

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockedApi.setlistSongs.bulkUpdate).toHaveBeenCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({ song_id: 1, position: 1 }),
          expect.objectContaining({ song_id: 2, position: 2 }),
        ])
      );
    });
  });

  it('shows save button disabled when no changes', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });

  it('resets changes on cancel', async () => {
    renderWithTheme(<EditorLayout setlistId={1} bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
    });

    // Add Song B to make dirty
    fireEvent.click(screen.getByRole('button', { name: /add song b/i }));

    // Cancel should be enabled now
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).not.toBeDisabled();

    fireEvent.click(cancelButton);

    // Save and cancel should be disabled again
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
