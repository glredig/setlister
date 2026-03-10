module Api
  class SetlistSongsController < ApplicationController
    def bulk_update
      setlist = Setlist.find(params[:id])

      ActiveRecord::Base.transaction do
        setlist.setlist_songs.destroy_all

        songs_params = params[:songs].present? ? params[:songs].select(&:present?) : []
        songs_params.each do |song_entry|
          setlist_song = setlist.setlist_songs.create!(
            song_id: song_entry[:song_id],
            position: song_entry[:position]
          )

          config_params = song_entry[:performance_config] || {}
          setlist_song.create_song_performance_config!(
            lead_vocalist_ids: config_params[:lead_vocalist_ids] || [],
            backup_vocalist_ids: config_params[:backup_vocalist_ids] || [],
            solos: config_params[:solos] || [],
            instrument_overrides: config_params[:instrument_overrides] || {},
            free_text_notes: config_params[:free_text_notes] || ""
          )
        end
      end

      setlist.reload
      render json: setlist.as_detailed_json
    end
  end
end
