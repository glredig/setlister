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

describe('api.setlistSongs', () => {
  it('bulkUpdate sends PUT with songs array', async () => {
    const updatedSetlist = {
      id: 1, name: 'Friday Set', date: '2026-03-20', notes: '',
      setlist_songs: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updatedSetlist),
    });

    const songs = [
      { song_id: 1, position: 1, performance_config: {} },
      { song_id: 2, position: 2, performance_config: {} },
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
