module Api
  class SetlistsController < ApplicationController
    before_action :set_setlist, only: [:show, :update, :destroy]

    def index
      setlists = Band.find(params[:band_id]).setlists.order(date: :desc)
      render json: setlists.as_json(only: [:id, :name, :date, :notes])
    end

    def create
      band = Band.find(params[:band_id])
      setlist = band.setlists.build(setlist_params)

      if setlist.save
        render json: setlist, status: :created
      else
        render json: { errors: setlist.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def show
      render json: setlist_json
    end

    def update
      if @setlist.update(setlist_params)
        render json: @setlist
      else
        render json: { errors: @setlist.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @setlist.destroy
      head :no_content
    end

    private

    def set_setlist
      @setlist = Setlist.find(params[:id])
    end

    def setlist_params
      params.require(:setlist).permit(:name, :date, :notes)
    end

    def setlist_json
      @setlist.as_json(
        only: [:id, :name, :date, :notes],
        include: {
          setlist_songs: {
            only: [:id, :position],
            include: {
              song: { only: [:id, :title, :artist, :tempo, :key, :time_signature, :duration] },
              song_performance_config: {
                only: [:id, :lead_vocalist_id, :backup_vocalist_ids, :guitar_solo_id,
                       :instrument_overrides, :free_text_notes]
              }
            }
          }
        }
      )
    end
  end
end
