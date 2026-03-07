require "rails_helper"

RSpec.describe SetlistSong, type: :model do
  describe "validations" do
    it "is valid with all attributes" do
      setlist_song = build(:setlist_song)
      expect(setlist_song).to be_valid
    end

    it "is invalid without a position" do
      setlist_song = build(:setlist_song, position: nil)
      expect(setlist_song).not_to be_valid
    end

    it "requires unique position within a setlist" do
      setlist = create(:setlist)
      create(:setlist_song, setlist: setlist, position: 1)
      duplicate = build(:setlist_song, setlist: setlist, position: 1)
      expect(duplicate).not_to be_valid
    end

    it "allows same position in different setlists" do
      song = create(:song)
      setlist_song_1 = create(:setlist_song, position: 1, song: song)
      setlist_song_2 = build(:setlist_song, position: 1, song: song)
      expect(setlist_song_2).to be_valid
    end
  end

  describe "associations" do
    it "belongs to a setlist" do
      association = described_class.reflect_on_association(:setlist)
      expect(association.macro).to eq(:belongs_to)
    end

    it "belongs to a song" do
      association = described_class.reflect_on_association(:song)
      expect(association.macro).to eq(:belongs_to)
    end

    it "has one song_performance_config" do
      association = described_class.reflect_on_association(:song_performance_config)
      expect(association.macro).to eq(:has_one)
    end
  end
end
