require "rails_helper"

RSpec.describe "Songs API", type: :request do
  let(:band) { create(:band) }

  describe "GET /api/bands/:band_id/songs" do
    before do
      create(:song, title: "Bohemian Rhapsody", artist: "Queen", tempo: 72, key: "Bb")
      create(:song, title: "Don't Stop Me Now", artist: "Queen", tempo: 156, key: "F")
      create(:song, title: "Superstition", artist: "Stevie Wonder", tempo: 101, key: "Ebm")
    end

    it "returns all songs" do
      get "/api/bands/#{band.id}/songs"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(3)
    end

    it "filters by search query" do
      get "/api/bands/#{band.id}/songs", params: { q: "Queen" }

      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
    end

    it "filters by key" do
      get "/api/bands/#{band.id}/songs", params: { key: "F" }

      json = JSON.parse(response.body)
      expect(json.length).to eq(1)
      expect(json[0]["title"]).to eq("Don't Stop Me Now")
    end

    it "filters by minimum tempo" do
      get "/api/bands/#{band.id}/songs", params: { tempo_min: 100 }

      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
    end
  end

  describe "POST /api/bands/:band_id/songs" do
    it "creates a song" do
      post "/api/bands/#{band.id}/songs", params: {
        song: { title: "New Song", artist: "New Artist", tempo: 120, key: "C", time_signature: "4/4", duration: 210 }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["title"]).to eq("New Song")
    end
  end

  describe "PUT /api/songs/:id" do
    it "updates a song" do
      song = create(:song)

      put "/api/songs/#{song.id}", params: { song: { tempo: 140 } }

      expect(response).to have_http_status(:ok)
      expect(song.reload.tempo).to eq(140)
    end
  end

  describe "DELETE /api/songs/:id" do
    it "deletes a song" do
      song = create(:song)

      delete "/api/songs/#{song.id}"

      expect(response).to have_http_status(:no_content)
    end
  end
end
