FactoryBot.define do
  factory :member do
    name { "Mike" }
    instruments { ["guitar", "vocals"] }
    role { "band_member" }
    band
  end
end
