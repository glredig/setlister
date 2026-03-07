require "rails_helper"

RSpec.describe Band, type: :model do
  describe "validations" do
    it "is valid with a name" do
      band = build(:band, name: "The Originals")
      expect(band).to be_valid
    end

    it "is invalid without a name" do
      band = build(:band, name: nil)
      expect(band).not_to be_valid
    end

    it "is invalid with a blank name" do
      band = build(:band, name: "")
      expect(band).not_to be_valid
    end
  end

  describe "associations" do
    it "has many members" do
      association = described_class.reflect_on_association(:members)
      expect(association.macro).to eq(:has_many)
    end

    it "has many setlists" do
      association = described_class.reflect_on_association(:setlists)
      expect(association.macro).to eq(:has_many)
    end
  end
end
