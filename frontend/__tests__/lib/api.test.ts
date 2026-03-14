import { api } from '@/lib/api';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

describe('api.setlists', () => {
  it('list fetches setlists for a band', async () => {
    const setlists = [{ id: 1, name: 'Friday Set', date: '2026-03-20', notes: '', inter_song_gap_seconds: 30 }];
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
    const newSetlist = { id: 2, name: 'New Set', date: '2026-04-01', notes: '', inter_song_gap_seconds: 30 };
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

  it('creates a setlist with inter_song_gap_seconds', async () => {
    const mockSetlist = { id: 1, name: 'Test', date: '2026-03-15', notes: '', inter_song_gap_seconds: 45 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockSetlist),
    });

    const result = await api.setlists.create(1, { name: 'Test', date: '2026-03-15', inter_song_gap_seconds: 45 });

    expect(result.inter_song_gap_seconds).toBe(45);
    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.setlist.inter_song_gap_seconds).toBe(45);
  });

  it('updates a setlist with inter_song_gap_seconds', async () => {
    const mockSetlist = { id: 1, name: 'Test', date: '2026-03-15', notes: '', inter_song_gap_seconds: 60 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockSetlist),
    });

    const result = await api.setlists.update(1, { inter_song_gap_seconds: 60 });

    expect(result.inter_song_gap_seconds).toBe(60);
    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.setlist.inter_song_gap_seconds).toBe(60);
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

describe('memberSongNotes', () => {
  it('lists notes for a member on a setlist', async () => {
    const mockNotes = [{ id: 1, setlist_song_id: 10, note: 'Watch the bridge' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockNotes),
    });

    const result = await api.memberSongNotes.list(1, 5);

    expect(result).toEqual(mockNotes);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toContain('/api/member_song_notes?setlist_id=1&member_id=5');
  });

  it('upserts a member note', async () => {
    const mockNote = { id: 1, setlist_song_id: 10, note: 'Updated note' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockNote),
    });

    const result = await api.memberSongNotes.upsert({
      member_id: 5,
      setlist_song_id: 10,
      note: 'Updated note',
    });

    expect(result.note).toBe('Updated note');
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].method).toBe('POST');
    const body = JSON.parse(fetchCall[1].body);
    expect(body.member_song_note.member_id).toBe(5);
  });

  it('returns undefined when upserting empty note (204)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await api.memberSongNotes.upsert({
      member_id: 5,
      setlist_song_id: 10,
      note: '',
    });

    expect(result).toBeUndefined();
  });
});

describe('api.setlistSongs', () => {
  it('bulkUpdate sends PUT with songs array', async () => {
    const updatedSetlist = {
      id: 1, name: 'Friday Set', date: '2026-03-20', notes: '', inter_song_gap_seconds: 30,
      setlist_songs: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updatedSetlist),
    });

    const songs = [
      { song_id: 1, position: 1, performance_config: { lead_vocalist_ids: [1], solos: [] } },
      { song_id: 2, position: 2, performance_config: { lead_vocalist_ids: [], solos: [{ member_id: 1, instrument: 'guitar' }] } },
    ];

    const result = await api.setlistSongs.bulkUpdate(1, songs);
    expect(result).toEqual(updatedSetlist);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/setlists/1/songs',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ songs }),
      })
    );
  });
});
