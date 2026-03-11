FactoryBot.define do
  factory :setlist do
    name { "Friday Night Set" }
    date { Date.today }
    notes { "" }
    inter_song_gap_seconds { 30 }
    band
  end
end
