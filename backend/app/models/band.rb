class Band < ApplicationRecord
  has_many :members, dependent: :destroy
  has_many :setlists, dependent: :destroy

  validates :name, presence: true
end
