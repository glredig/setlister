import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { RepertoirePanel } from '@/components/Editor/RepertoirePanel';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockSongs = [
  { id: 1, title: 'Bohemian Rhapsody', artist: 'Queen', tempo: 72, key: 'Bb', time_signature: '4/4', duration: 355 },
  { id: 2, title: 'Stairway to Heaven', artist: 'Led Zeppelin', tempo: 82, key: 'Am', time_signature: '4/4', duration: 482 },
  { id: 3, title: 'Back in Black', artist: 'AC/DC', tempo: 96, key: 'E', time_signature: '4/4', duration: 255 },
];

describe('RepertoirePanel', () => {
  it('renders all songs', () => {
    renderWithTheme(<RepertoirePanel songs={mockSongs} onAddSong={jest.fn()} setlistSongIds={[]} />);

    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.getByText('Stairway to Heaven')).toBeInTheDocument();
    expect(screen.getByText('Back in Black')).toBeInTheDocument();
  });

  it('filters songs by search query', () => {
    renderWithTheme(<RepertoirePanel songs={mockSongs} onAddSong={jest.fn()} setlistSongIds={[]} />);

    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'bohemian' } });

    expect(screen.getByText('Bohemian Rhapsody')).toBeInTheDocument();
    expect(screen.queryByText('Stairway to Heaven')).not.toBeInTheDocument();
    expect(screen.queryByText('Back in Black')).not.toBeInTheDocument();
  });

  it('calls onAddSong when add button is clicked', () => {
    const onAddSong = jest.fn();
    renderWithTheme(<RepertoirePanel songs={mockSongs} onAddSong={onAddSong} setlistSongIds={[]} />);

    fireEvent.click(screen.getAllByRole('button', { name: /add/i })[0]);

    expect(onAddSong).toHaveBeenCalledWith(mockSongs[0]);
  });

  it('dims songs already in setlist', () => {
    renderWithTheme(<RepertoirePanel songs={mockSongs} onAddSong={jest.fn()} setlistSongIds={[1]} />);

    const addButtons = screen.getAllByRole('button', { name: /add/i });
    // First song (id=1) is in setlist, its add button should be disabled
    expect(addButtons[0]).toBeDisabled();
  });
});
