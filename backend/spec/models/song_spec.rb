require "rails_helper"

RSpec.describe Song, type: :model do
  describe "validations" do
    it "is valid with title and artist" do
      song = build(:song)
      expect(song).to be_valid
    end

    it "is invalid without a title" do
      song = build(:song, title: nil)
      expect(song).not_to be_valid
    end

    it "is invalid without an artist" do
      song = build(:song, artist: nil)
      expect(song).not_to be_valid
    end
  end

  describe "scopes" do
    before do
      create(:song, title: "Bohemian Rhapsody", artist: "Queen", tempo: 72, key: "Bb")
      create(:song, title: "Don't Stop Me Now", artist: "Queen", tempo: 156, key: "F")
      create(:song, title: "Superstition", artist: "Stevie Wonder", tempo: 101, key: "Ebm")
    end

    it "searches by title" do
      results = Song.search("Bohemian")
      expect(results.count).to eq(1)
      expect(results.first.title).to eq("Bohemian Rhapsody")
    end

    it "searches by artist" do
      results = Song.search("Queen")
      expect(results.count).to eq(2)
    end

    it "search is case-insensitive" do
      results = Song.search("bohemian")
      expect(results.count).to eq(1)
    end

    it "filters by key" do
      results = Song.where(key: "F")
      expect(results.count).to eq(1)
      expect(results.first.title).to eq("Don't Stop Me Now")
    end
  end
end
