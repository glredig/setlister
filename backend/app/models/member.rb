class Member < ApplicationRecord
  belongs_to :band

  VALID_ROLES = %w[band_member engineer].freeze

  validates :name, presence: true
  validates :role, presence: true, inclusion: { in: VALID_ROLES }
end
