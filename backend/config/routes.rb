Rails.application.routes.draw do
  namespace :api do
    resources :bands, only: [:show, :update] do
      resources :members, only: [:create]
      resources :songs, only: [:index, :create]
      resources :setlists, only: [:index, :create]
    end
    resources :members, only: [:update, :destroy]
    resources :songs, only: [:update, :destroy]
    resources :setlists, only: [:show, :update, :destroy] do
      put "songs", to: "setlist_songs#bulk_update", on: :member
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
