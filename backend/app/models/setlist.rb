class Setlist < ApplicationRecord
  belongs_to :band
  has_many :setlist_songs, -> { order(:position) }, dependent: :destroy
  has_many :songs, through: :setlist_songs

  validates :name, presence: true

  def as_detailed_json
    as_json(
      only: [:id, :name, :date, :notes],
      include: {
        setlist_songs: {
          only: [:id, :position],
          include: {
            song: { only: [:id, :title, :artist, :tempo, :key, :time_signature, :duration] },
            song_performance_config: {
              only: [:id, :lead_vocalist_id, :backup_vocalist_ids, :guitar_solo_id,
                     :instrument_overrides, :free_text_notes]
            }
          }
        }
      }
    )
  end
end
