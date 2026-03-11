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
  lead_vocalist_ids: number[];
  backup_vocalist_ids: number[];
  solos: Array<{ member_id: number; instrument: string }>;
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
  inter_song_gap_seconds: number;
}

export interface SetlistDetail extends Setlist {
  setlist_songs: SetlistSong[];
}
