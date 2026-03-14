class Api::MemberSongNotesController < ApplicationController
  def index
    notes = MemberSongNote
      .joins(:setlist_song)
      .where(member_id: params[:member_id], setlist_songs: { setlist_id: params[:setlist_id] })
    render json: notes.as_json(only: [:id, :setlist_song_id, :note])
  end

  def upsert
    if note_params[:note].blank?
      existing = MemberSongNote.find_by(
        member_id: note_params[:member_id],
        setlist_song_id: note_params[:setlist_song_id]
      )
      existing&.destroy!
      head :no_content
    else
      note = MemberSongNote.find_or_initialize_by(
        member_id: note_params[:member_id],
        setlist_song_id: note_params[:setlist_song_id]
      )
      note.note = note_params[:note]
      note.save!
      render json: note.as_json(only: [:id, :setlist_song_id, :note])
    end
  end

  private

  def note_params
    params.require(:member_song_note).permit(:member_id, :setlist_song_id, :note)
  end
end
