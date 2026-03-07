FactoryBot.define do
  factory :setlist_song do
    setlist
    song
    position { 1 }
  end
end
