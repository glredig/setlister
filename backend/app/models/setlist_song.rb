class SetlistSong < ApplicationRecord
  belongs_to :setlist
  belongs_to :song
  has_one :song_performance_config, dependent: :destroy
  has_many :member_song_notes, dependent: :destroy

  validates :position, presence: true,
    uniqueness: { scope: :setlist_id }
end
