class Song < ApplicationRecord
  validates :title, presence: true
  validates :artist, presence: true

  scope :search, ->(query) {
    where("title ILIKE :q OR artist ILIKE :q", q: "%#{query}%")
  }
end
