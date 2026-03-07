require "rails_helper"

RSpec.describe "Bands API", type: :request do
  describe "GET /api/bands/:id" do
    it "returns the band with members" do
      band = create(:band)
      member = create(:member, band: band)

      get "/api/bands/#{band.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq(band.name)
      expect(json["members"].length).to eq(1)
      expect(json["members"][0]["name"]).to eq(member.name)
      expect(json["members"][0]["instruments"]).to eq(member.instruments)
    end

    it "returns 404 for non-existent band" do
      get "/api/bands/999"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PUT /api/bands/:id" do
    it "updates the band name" do
      band = create(:band, name: "Old Name")

      put "/api/bands/#{band.id}", params: { band: { name: "New Name" } }

      expect(response).to have_http_status(:ok)
      expect(band.reload.name).to eq("New Name")
    end

    it "returns errors for invalid update" do
      band = create(:band)

      put "/api/bands/#{band.id}", params: { band: { name: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
