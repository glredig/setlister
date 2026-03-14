class MemberSongNote < ApplicationRecord
  belongs_to :member
  belongs_to :setlist_song
  validates :note, presence: true
  validates :member_id, uniqueness: { scope: :setlist_song_id }
end
