require "rails_helper"

RSpec.describe "Setlist Songs Bulk Update API", type: :request do
  let(:band) { create(:band) }
  let(:setlist) { create(:setlist, band: band) }
  let(:member) { create(:member, band: band) }

  describe "PUT /api/setlists/:id/songs" do
    it "replaces all songs in a setlist" do
      song1 = create(:song, title: "Song A")
      song2 = create(:song, title: "Song B")

      put "/api/setlists/#{setlist.id}/songs", params: {
        songs: [
          { song_id: song1.id, position: 1, performance_config: { lead_vocalist_ids: [member.id] } },
          { song_id: song2.id, position: 2, performance_config: { free_text_notes: "Big finish" } }
        ]
      }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["setlist_songs"].length).to eq(2)
      expect(json["setlist_songs"][0]["song"]["title"]).to eq("Song A")
      expect(json["setlist_songs"][0]["song_performance_config"]["lead_vocalist_ids"]).to eq([member.id])
      expect(json["setlist_songs"][1]["song"]["title"]).to eq("Song B")
      expect(json["setlist_songs"][1]["song_performance_config"]["free_text_notes"]).to eq("Big finish")
    end

    it "removes songs not included in the update" do
      song1 = create(:song)
      song2 = create(:song)
      create(:setlist_song, setlist: setlist, song: song1, position: 1)
      create(:setlist_song, setlist: setlist, song: song2, position: 2)

      put "/api/setlists/#{setlist.id}/songs", params: {
        songs: [
          { song_id: song1.id, position: 1, performance_config: {} }
        ]
      }

      expect(response).to have_http_status(:ok)
      expect(setlist.setlist_songs.count).to eq(1)
    end

    it "reorders songs" do
      song1 = create(:song, title: "First")
      song2 = create(:song, title: "Second")
      create(:setlist_song, setlist: setlist, song: song1, position: 1)
      create(:setlist_song, setlist: setlist, song: song2, position: 2)

      put "/api/setlists/#{setlist.id}/songs", params: {
        songs: [
          { song_id: song2.id, position: 1, performance_config: {} },
          { song_id: song1.id, position: 2, performance_config: {} }
        ]
      }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["setlist_songs"][0]["song"]["title"]).to eq("Second")
      expect(json["setlist_songs"][1]["song"]["title"]).to eq("First")
    end

    it "handles an empty setlist" do
      create(:setlist_song, setlist: setlist, song: create(:song), position: 1)

      put "/api/setlists/#{setlist.id}/songs", params: { songs: [] }

      expect(response).to have_http_status(:ok)
      expect(setlist.setlist_songs.count).to eq(0)
    end
  end
end
