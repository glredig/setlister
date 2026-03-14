require 'rails_helper'

RSpec.describe "MemberSongNotes API", type: :request do
  let(:band) { create(:band) }
  let(:member) { create(:member, band: band) }
  let(:setlist) { create(:setlist, band: band) }
  let(:song) { create(:song) }
  let(:setlist_song) { create(:setlist_song, setlist: setlist, song: song, position: 1) }

  describe "GET /api/member_song_notes" do
    it "returns notes for a member on a setlist" do
      MemberSongNote.create!(member: member, setlist_song: setlist_song, note: "Watch the bridge")

      get "/api/member_song_notes", params: { setlist_id: setlist.id, member_id: member.id }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(1)
      expect(json[0]["setlist_song_id"]).to eq(setlist_song.id)
      expect(json[0]["note"]).to eq("Watch the bridge")
    end

    it "does not return notes for other members" do
      other_member = create(:member, band: band, name: "Other")
      MemberSongNote.create!(member: other_member, setlist_song: setlist_song, note: "Not mine")

      get "/api/member_song_notes", params: { setlist_id: setlist.id, member_id: member.id }

      json = JSON.parse(response.body)
      expect(json.length).to eq(0)
    end

    it "does not return notes for other setlists" do
      other_setlist = create(:setlist, band: band, name: "Other Set")
      other_ss = create(:setlist_song, setlist: other_setlist, song: song, position: 1)
      MemberSongNote.create!(member: member, setlist_song: other_ss, note: "Wrong setlist")

      get "/api/member_song_notes", params: { setlist_id: setlist.id, member_id: member.id }

      json = JSON.parse(response.body)
      expect(json.length).to eq(0)
    end
  end

  describe "POST /api/member_song_notes" do
    it "creates a new note" do
      post "/api/member_song_notes", params: {
        member_song_note: { member_id: member.id, setlist_song_id: setlist_song.id, note: "New note" }
      }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["note"]).to eq("New note")
      expect(json["setlist_song_id"]).to eq(setlist_song.id)
    end

    it "updates an existing note" do
      existing = MemberSongNote.create!(member: member, setlist_song: setlist_song, note: "Old")

      post "/api/member_song_notes", params: {
        member_song_note: { member_id: member.id, setlist_song_id: setlist_song.id, note: "Updated" }
      }

      expect(response).to have_http_status(:ok)
      expect(existing.reload.note).to eq("Updated")
    end

    it "deletes the note when note is empty string" do
      MemberSongNote.create!(member: member, setlist_song: setlist_song, note: "To delete")

      post "/api/member_song_notes", params: {
        member_song_note: { member_id: member.id, setlist_song_id: setlist_song.id, note: "" }
      }

      expect(response).to have_http_status(:no_content)
      expect(MemberSongNote.count).to eq(0)
    end

    it "returns no_content when deleting a non-existent note with empty string" do
      post "/api/member_song_notes", params: {
        member_song_note: { member_id: member.id, setlist_song_id: setlist_song.id, note: "" }
      }

      expect(response).to have_http_status(:no_content)
    end
  end
end
