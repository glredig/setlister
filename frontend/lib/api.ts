const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || error.errors?.join(', ') || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  bands: {
    get: (id: number) => request<import('./types').Band>(`/api/bands/${id}`),
  },

  setlists: {
    list: (bandId: number) => request<import('./types').Setlist[]>(`/api/bands/${bandId}/setlists`),
    get: (id: number) => request<import('./types').SetlistDetail>(`/api/setlists/${id}`),
    create: (bandId: number, data: { name: string; date: string; notes?: string }) =>
      request<import('./types').Setlist>(`/api/bands/${bandId}/setlists`, {
        method: 'POST',
        body: JSON.stringify({ setlist: data }),
      }),
    update: (id: number, data: Partial<{ name: string; date: string; notes: string }>) =>
      request<import('./types').Setlist>(`/api/setlists/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ setlist: data }),
      }),
    delete: (id: number) => request<void>(`/api/setlists/${id}`, { method: 'DELETE' }),
  },

  setlistSongs: {
    bulkUpdate: (setlistId: number, songs: Array<{
      song_id: number;
      position: number;
      performance_config: Record<string, unknown>;
    }>) =>
      request<import('./types').SetlistDetail>(`/api/setlists/${setlistId}/songs`, {
        method: 'PUT',
        body: JSON.stringify({ songs }),
      }),
  },

  songs: {
    list: (bandId: number, params?: { q?: string; key?: string; tempo_min?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.key) searchParams.set('key', params.key);
      if (params?.tempo_min) searchParams.set('tempo_min', String(params.tempo_min));
      const qs = searchParams.toString();
      return request<import('./types').Song[]>(`/api/bands/${bandId}/songs${qs ? `?${qs}` : ''}`);
    },
  },
};
