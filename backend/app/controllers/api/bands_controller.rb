module Api
  class BandsController < ApplicationController
    before_action :set_band

    def show
      render json: band_json
    end

    def update
      if @band.update(band_params)
        render json: band_json
      else
        render json: { errors: @band.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def set_band
      @band = Band.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Band not found" }, status: :not_found
    end

    def band_params
      params.require(:band).permit(:name)
    end

    def band_json
      @band.as_json(include: {
        members: { only: [:id, :name, :instruments, :role] }
      })
    end
  end
end
