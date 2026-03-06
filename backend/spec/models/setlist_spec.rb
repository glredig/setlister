require "rails_helper"

RSpec.describe Setlist, type: :model do
  describe "validations" do
    it "is valid with a name and band" do
      setlist = build(:setlist)
      expect(setlist).to be_valid
    end

    it "is invalid without a name" do
      setlist = build(:setlist, name: nil)
      expect(setlist).not_to be_valid
    end
  end

  describe "associations" do
    it "belongs to a band" do
      association = described_class.reflect_on_association(:band)
      expect(association.macro).to eq(:belongs_to)
    end

    it "has many setlist_songs" do
      association = described_class.reflect_on_association(:setlist_songs)
      expect(association.macro).to eq(:has_many)
    end

    it "has many songs through setlist_songs" do
      association = described_class.reflect_on_association(:songs)
      expect(association.macro).to eq(:has_many)
    end
  end
end
