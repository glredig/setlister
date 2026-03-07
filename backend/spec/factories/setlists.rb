FactoryBot.define do
  factory :setlist do
    name { "Friday Night Set" }
    date { Date.today }
    notes { "" }
    band
  end
end
