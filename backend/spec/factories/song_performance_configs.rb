FactoryBot.define do
  factory :song_performance_config do
    setlist_song
    lead_vocalist_ids { [] }
    backup_vocalist_ids { [] }
    solos { [] }
    instrument_overrides { {} }
    free_text_notes { "" }
  end
end
