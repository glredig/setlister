import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { SetlistPanel } from '@/components/Editor/SetlistPanel';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockSetlistSongs = [
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
];

describe('SetlistPanel', () => {
  it('renders songs in order', () => {
    renderWithTheme(
      <SetlistPanel
        setlistSongs={mockSetlistSongs}
        onReorder={jest.fn()}
        onRemove={jest.fn()}
        expandedId={null}
        onToggleExpand={jest.fn()}
        onConfigChange={jest.fn()}
        members={[]}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );

    expect(screen.getByText('Song A')).toBeInTheDocument();
    expect(screen.getByText('Song B')).toBeInTheDocument();
  });

  it('shows empty state when no songs', () => {
    renderWithTheme(
      <SetlistPanel
        setlistSongs={[]}
        onReorder={jest.fn()}
        onRemove={jest.fn()}
        expandedId={null}
        onToggleExpand={jest.fn()}
        onConfigChange={jest.fn()}
        members={[]}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );

    expect(screen.getByText(/add songs/i)).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();
    renderWithTheme(
      <SetlistPanel
        setlistSongs={mockSetlistSongs}
        onReorder={jest.fn()}
        onRemove={onRemove}
        expandedId={null}
        onToggleExpand={jest.fn()}
        onConfigChange={jest.fn()}
        members={[]}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: /remove/i })[0]);

    expect(onRemove).toHaveBeenCalledWith(10);
  });

  it('renders the duration summary bar', () => {
    renderWithTheme(
      <SetlistPanel
        setlistSongs={mockSetlistSongs}
        onReorder={jest.fn()}
        onRemove={jest.fn()}
        expandedId={null}
        onToggleExpand={jest.fn()}
        onConfigChange={jest.fn()}
        members={[]}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );

    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByLabelText('Time between songs (seconds)')).toHaveValue(30);
  });
});
