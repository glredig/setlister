module Api
  class SetlistsController < ApplicationController
    before_action :set_setlist, only: [:show, :update, :destroy]

    def index
      setlists = Band.find(params[:band_id]).setlists.order(date: :desc)
      render json: setlists.as_json(only: [:id, :name, :date, :notes, :inter_song_gap_seconds])
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
      render json: @setlist.as_detailed_json
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
      params.require(:setlist).permit(:name, :date, :notes, :inter_song_gap_seconds)
    end
  end
end
