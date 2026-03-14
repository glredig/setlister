FactoryBot.define do
  factory :member_song_note do
    member
    setlist_song
    note { "Remember the bridge section" }
  end
end
