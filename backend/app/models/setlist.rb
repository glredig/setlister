class Setlist < ApplicationRecord
  belongs_to :band
  has_many :setlist_songs, -> { order(:position) }, dependent: :destroy
  has_many :songs, through: :setlist_songs

  validates :name, presence: true
end
