class Member < ApplicationRecord
  belongs_to :band
  has_many :member_song_notes, dependent: :destroy

  VALID_ROLES = %w[band_member engineer].freeze

  validates :name, presence: true
  validates :role, presence: true, inclusion: { in: VALID_ROLES }
end
