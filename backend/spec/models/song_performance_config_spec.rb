require "rails_helper"

RSpec.describe SongPerformanceConfig, type: :model do
  describe "validations" do
    it "is valid with just a setlist_song" do
      config = build(:song_performance_config)
      expect(config).to be_valid
    end
  end

  describe "associations" do
    it "belongs to a setlist_song" do
      association = described_class.reflect_on_association(:setlist_song)
      expect(association.macro).to eq(:belongs_to)
    end
  end

  describe "optional fields" do
    it "stores lead vocalist id" do
      member = create(:member)
      config = create(:song_performance_config, lead_vocalist_id: member.id)
      config.reload
      expect(config.lead_vocalist_id).to eq(member.id)
    end

    it "stores backup vocalist ids as array" do
      members = create_list(:member, 2)
      config = create(:song_performance_config, backup_vocalist_ids: members.map(&:id))
      config.reload
      expect(config.backup_vocalist_ids).to eq(members.map(&:id))
    end

    it "stores instrument overrides as JSON" do
      member = create(:member)
      overrides = { member.id.to_s => "keys" }
      config = create(:song_performance_config, instrument_overrides: overrides)
      config.reload
      expect(config.instrument_overrides).to eq(overrides)
    end

    it "stores free text notes" do
      config = create(:song_performance_config, free_text_notes: "Start with piano intro")
      config.reload
      expect(config.free_text_notes).to eq("Start with piano intro")
    end
  end
end
