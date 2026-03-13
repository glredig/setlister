require "rails_helper"

RSpec.describe "Setlists API", type: :request do
  let(:band) { create(:band) }

  describe "GET /api/bands/:band_id/setlists" do
    it "returns all setlists for a band" do
      create(:setlist, band: band, name: "Friday Set")
      create(:setlist, band: band, name: "Saturday Set")

      get "/api/bands/#{band.id}/setlists"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
    end

    it "includes inter_song_gap_seconds in the list response" do
      create(:setlist, band: band, inter_song_gap_seconds: 45)
      get "/api/bands/#{band.id}/setlists"
      json = JSON.parse(response.body)
      expect(json[0]["inter_song_gap_seconds"]).to eq(45)
    end
  end

  describe "POST /api/bands/:band_id/setlists" do
    it "creates a setlist" do
      post "/api/bands/#{band.id}/setlists", params: {
        setlist: { name: "New Set", date: "2026-03-15", notes: "Opening night" }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("New Set")
    end

    it "defaults inter_song_gap_seconds to 30" do
      post "/api/bands/#{band.id}/setlists", params: { setlist: { name: "Gap Test", date: "2026-03-15" } }
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["inter_song_gap_seconds"]).to eq(30)
    end
  end

  describe "GET /api/setlists/:id" do
    it "returns the setlist with songs and performance configs" do
      setlist = create(:setlist, band: band)
      song = create(:song, title: "Test Song", tempo: 120)
      setlist_song = create(:setlist_song, setlist: setlist, song: song, position: 1)
      member = create(:member, band: band)
      create(:song_performance_config,
        setlist_song: setlist_song,
        lead_vocalist_ids: [member.id],
        free_text_notes: "Start soft"
      )

      get "/api/setlists/#{setlist.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq(setlist.name)
      expect(json["setlist_songs"].length).to eq(1)
      expect(json["setlist_songs"][0]["song"]["title"]).to eq("Test Song")
      expect(json["setlist_songs"][0]["song_performance_config"]["lead_vocalist_ids"]).to eq([member.id])
      expect(json["setlist_songs"][0]["song_performance_config"]["free_text_notes"]).to eq("Start soft")
    end

    it "returns inter_song_gap_seconds in the response" do
      setlist = create(:setlist, band: band, inter_song_gap_seconds: 45)
      get "/api/setlists/#{setlist.id}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["inter_song_gap_seconds"]).to eq(45)
    end
  end

  describe "PUT /api/setlists/:id" do
    it "updates setlist metadata" do
      setlist = create(:setlist, band: band)

      put "/api/setlists/#{setlist.id}", params: { setlist: { name: "Updated Name" } }

      expect(response).to have_http_status(:ok)
      expect(setlist.reload.name).to eq("Updated Name")
    end

    it "updates inter_song_gap_seconds" do
      setlist = create(:setlist, band: band)
      put "/api/setlists/#{setlist.id}", params: { setlist: { inter_song_gap_seconds: 60 } }
      expect(response).to have_http_status(:ok)
      expect(setlist.reload.inter_song_gap_seconds).to eq(60)
    end
  end

  describe "DELETE /api/setlists/:id" do
    it "deletes the setlist and associated songs" do
      setlist = create(:setlist, band: band)
      song = create(:song)
      create(:setlist_song, setlist: setlist, song: song, position: 1)

      delete "/api/setlists/#{setlist.id}"

      expect(response).to have_http_status(:no_content)
      expect(Setlist.find_by(id: setlist.id)).to be_nil
      expect(SetlistSong.where(setlist_id: setlist.id)).to be_empty
    end
  end
end
