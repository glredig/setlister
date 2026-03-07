module Api
  class MembersController < ApplicationController
    before_action :set_member, only: [:update, :destroy]

    def create
      band = Band.find(params[:band_id])
      member = band.members.build(member_params)

      if member.save
        render json: member.as_json(only: [:id, :name, :instruments, :role]), status: :created
      else
        render json: { errors: member.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @member.update(member_params)
        render json: @member.as_json(only: [:id, :name, :instruments, :role])
      else
        render json: { errors: @member.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @member.destroy
      head :no_content
    end

    private

    def set_member
      @member = Member.find(params[:id])
    end

    def member_params
      params.require(:member).permit(:name, :role, instruments: [])
    end
  end
end
