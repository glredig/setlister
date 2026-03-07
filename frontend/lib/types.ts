export interface Member {
  id: number;
  name: string;
  instruments: string[];
  role: 'band_member' | 'engineer';
}

export interface Band {
  id: number;
  name: string;
  members: Member[];
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  tempo: number;
  key: string;
  time_signature: string;
  duration: number;
}

export interface SongPerformanceConfig {
  id: number;
  lead_vocalist_id: number | null;
  backup_vocalist_ids: number[];
  guitar_solo_id: number | null;
  instrument_overrides: Record<string, string>;
  free_text_notes: string;
}

export interface SetlistSong {
  id: number;
  position: number;
  song: Song;
  song_performance_config: SongPerformanceConfig;
}

export interface Setlist {
  id: number;
  name: string;
  date: string;
  notes: string;
}

export interface SetlistDetail extends Setlist {
  setlist_songs: SetlistSong[];
}
