require "rails_helper"

RSpec.describe "Members API", type: :request do
  describe "POST /api/bands/:band_id/members" do
    it "creates a new member" do
      band = create(:band)

      post "/api/bands/#{band.id}/members", params: {
        member: { name: "Jake", instruments: ["guitar", "keys"], role: "band_member" }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("Jake")
      expect(json["instruments"]).to eq(["guitar", "keys"])
    end

    it "returns errors for invalid member" do
      band = create(:band)

      post "/api/bands/#{band.id}/members", params: {
        member: { name: "", role: "band_member" }
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PUT /api/members/:id" do
    it "updates the member" do
      member = create(:member, name: "Old Name")

      put "/api/members/#{member.id}", params: {
        member: { name: "New Name" }
      }

      expect(response).to have_http_status(:ok)
      expect(member.reload.name).to eq("New Name")
    end
  end

  describe "DELETE /api/members/:id" do
    it "deletes the member" do
      member = create(:member)

      delete "/api/members/#{member.id}"

      expect(response).to have_http_status(:no_content)
      expect(Member.find_by(id: member.id)).to be_nil
    end
  end
end
