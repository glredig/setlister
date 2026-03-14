import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { MemberNoteTextarea } from '@/components/Editor/MemberNoteTextarea';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

jest.useFakeTimers();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('MemberNoteTextarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial note value', () => {
    renderWithTheme(
      <MemberNoteTextarea memberId={1} setlistSongId={10} initialNote="Watch the bridge" />
    );
    expect(screen.getByLabelText('My Notes')).toHaveValue('Watch the bridge');
  });

  it('renders empty when no initial note', () => {
    renderWithTheme(
      <MemberNoteTextarea memberId={1} setlistSongId={10} initialNote="" />
    );
    expect(screen.getByLabelText('My Notes')).toHaveValue('');
  });

  it('debounces save after typing', async () => {
    mockedApi.memberSongNotes.upsert.mockResolvedValue({ id: 1, setlist_song_id: 10, note: 'New note' });

    renderWithTheme(
      <MemberNoteTextarea memberId={1} setlistSongId={10} initialNote="" />
    );

    fireEvent.change(screen.getByLabelText('My Notes'), { target: { value: 'New note' } });
    expect(mockedApi.memberSongNotes.upsert).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(1000); });

    expect(mockedApi.memberSongNotes.upsert).toHaveBeenCalledWith({
      member_id: 1,
      setlist_song_id: 10,
      note: 'New note',
    });
  });

  it('saves on blur if changed', () => {
    mockedApi.memberSongNotes.upsert.mockResolvedValue({ id: 1, setlist_song_id: 10, note: 'Blurred note' });

    renderWithTheme(
      <MemberNoteTextarea memberId={1} setlistSongId={10} initialNote="" />
    );

    fireEvent.change(screen.getByLabelText('My Notes'), { target: { value: 'Blurred note' } });
    fireEvent.blur(screen.getByLabelText('My Notes'));

    expect(mockedApi.memberSongNotes.upsert).toHaveBeenCalledWith({
      member_id: 1,
      setlist_song_id: 10,
      note: 'Blurred note',
    });
  });

  it('does not save on blur if unchanged', () => {
    renderWithTheme(
      <MemberNoteTextarea memberId={1} setlistSongId={10} initialNote="Same" />
    );

    fireEvent.blur(screen.getByLabelText('My Notes'));
    expect(mockedApi.memberSongNotes.upsert).not.toHaveBeenCalled();
  });

  it('shows Saved indicator after successful save', async () => {
    mockedApi.memberSongNotes.upsert.mockResolvedValue({ id: 1, setlist_song_id: 10, note: 'Note' });

    renderWithTheme(
      <MemberNoteTextarea memberId={1} setlistSongId={10} initialNote="" />
    );

    fireEvent.change(screen.getByLabelText('My Notes'), { target: { value: 'Note' } });
    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  it('shows Save failed indicator on error', async () => {
    mockedApi.memberSongNotes.upsert.mockRejectedValue(new Error('Network error'));

    renderWithTheme(
      <MemberNoteTextarea memberId={1} setlistSongId={10} initialNote="" />
    );

    fireEvent.change(screen.getByLabelText('My Notes'), { target: { value: 'Will fail' } });
    act(() => { jest.advanceTimersByTime(1000); });

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });
});
