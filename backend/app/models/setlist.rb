class Setlist < ApplicationRecord
  belongs_to :band
  has_many :setlist_songs, -> { order(:position) }, dependent: :destroy
  has_many :songs, through: :setlist_songs

  validates :name, presence: true
  validates :inter_song_gap_seconds, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def as_detailed_json
    as_json(
      only: [:id, :name, :date, :notes, :inter_song_gap_seconds],
      include: {
        setlist_songs: {
          only: [:id, :position],
          include: {
            song: { only: [:id, :title, :artist, :tempo, :key, :time_signature, :duration] },
            song_performance_config: {
              only: [:id, :lead_vocalist_ids, :backup_vocalist_ids, :solos,
                     :instrument_overrides, :free_text_notes]
            }
          }
        }
      }
    )
  end
end
