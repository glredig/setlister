require "rails_helper"

RSpec.describe Member, type: :model do
  describe "validations" do
    it "is valid with all attributes" do
      member = build(:member)
      expect(member).to be_valid
    end

    it "is invalid without a name" do
      member = build(:member, name: nil)
      expect(member).not_to be_valid
    end

    it "is invalid without a role" do
      member = build(:member, role: nil)
      expect(member).not_to be_valid
    end

    it "is invalid with an unknown role" do
      member = build(:member, role: "roadie")
      expect(member).not_to be_valid
    end

    it "is valid as band_member" do
      member = build(:member, role: "band_member")
      expect(member).to be_valid
    end

    it "is valid as engineer" do
      member = build(:member, role: "engineer")
      expect(member).to be_valid
    end
  end

  describe "associations" do
    it "belongs to a band" do
      association = described_class.reflect_on_association(:band)
      expect(association.macro).to eq(:belongs_to)
    end
  end

  describe "instruments" do
    it "stores multiple instruments as an array" do
      member = create(:member, instruments: ["guitar", "keys"])
      member.reload
      expect(member.instruments).to eq(["guitar", "keys"])
    end
  end
end
