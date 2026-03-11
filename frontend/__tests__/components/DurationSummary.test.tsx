import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { DurationSummary } from '@/components/Editor/DurationSummary';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('DurationSummary', () => {
  it('displays total duration formatted as hours and minutes', () => {
    // 2 songs: 300s + 240s = 540s songs, 1 gap × 30s = 30s, total = 570s = 9m 30s
    renderWithTheme(
      <DurationSummary
        songDurations={[300, 240]}
        gapSeconds={30}
        onGapChange={jest.fn()}
      />
    );
    expect(screen.getByText('9m 30s')).toBeInTheDocument();
  });

  it('displays duration in hours when over 60 minutes', () => {
    // 10 songs of 420s each = 4200s, 9 gaps × 30s = 270s, total = 4470s = 1h 14m
    const durations = Array(10).fill(420);
    renderWithTheme(
      <DurationSummary songDurations={durations} gapSeconds={30} onGapChange={jest.fn()} />
    );
    expect(screen.getByText('1h 14m')).toBeInTheDocument();
  });

  it('shows 0m when no songs', () => {
    renderWithTheme(
      <DurationSummary songDurations={[]} gapSeconds={30} onGapChange={jest.fn()} />
    );
    expect(screen.getByText('0m')).toBeInTheDocument();
  });

  it('renders the gap input with current value', () => {
    renderWithTheme(
      <DurationSummary songDurations={[300]} gapSeconds={45} onGapChange={jest.fn()} />
    );
    const input = screen.getByLabelText('Time between songs (seconds)');
    expect(input).toHaveValue(45);
  });

  it('calls onGapChange when gap input changes', () => {
    const onGapChange = jest.fn();
    renderWithTheme(
      <DurationSummary songDurations={[300]} gapSeconds={30} onGapChange={onGapChange} />
    );
    fireEvent.change(screen.getByLabelText('Time between songs (seconds)'), {
      target: { value: '60' },
    });
    expect(onGapChange).toHaveBeenCalledWith(60);
  });

  it('treats empty gap input as 0', () => {
    const onGapChange = jest.fn();
    renderWithTheme(
      <DurationSummary songDurations={[300]} gapSeconds={30} onGapChange={onGapChange} />
    );
    fireEvent.change(screen.getByLabelText('Time between songs (seconds)'), {
      target: { value: '' },
    });
    expect(onGapChange).toHaveBeenCalledWith(0);
  });

  it('does not count gaps when there is only one song', () => {
    // 1 song of 300s, 0 gaps, total = 300s = 5m
    renderWithTheme(
      <DurationSummary songDurations={[300]} gapSeconds={30} onGapChange={jest.fn()} />
    );
    expect(screen.getByText('5m')).toBeInTheDocument();
  });
});
