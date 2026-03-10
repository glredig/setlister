class SongPerformanceConfig < ApplicationRecord
  belongs_to :setlist_song

  validate :solos_structure

  private

  def solos_structure
    return if solos.blank?
    unless solos.is_a?(Array) && solos.all? { |s| s.is_a?(Hash) && s.key?("member_id") && s.key?("instrument") }
      errors.add(:solos, "must be an array of { member_id, instrument } objects")
    end
  end
end
