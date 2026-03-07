module Api
  class SongsController < ApplicationController
    before_action :set_song, only: [:update, :destroy]

    def index
      songs = Song.all
      songs = songs.search(params[:q]) if params[:q].present?
      songs = songs.where(key: params[:key]) if params[:key].present?
      songs = songs.where("tempo >= ?", params[:tempo_min]) if params[:tempo_min].present?

      render json: songs
    end

    def create
      song = Song.new(song_params)

      if song.save
        render json: song, status: :created
      else
        render json: { errors: song.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @song.update(song_params)
        render json: @song
      else
        render json: { errors: @song.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @song.destroy
      head :no_content
    end

    private

    def set_song
      @song = Song.find(params[:id])
    end

    def song_params
      params.require(:song).permit(:title, :artist, :tempo, :key, :time_signature, :duration)
    end
  end
end
