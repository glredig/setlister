FactoryBot.define do
  factory :song_performance_config do
    setlist_song
    lead_vocalist_id { nil }
    backup_vocalist_ids { [] }
    guitar_solo_id { nil }
    instrument_overrides { {} }
    free_text_notes { "" }
  end
end
