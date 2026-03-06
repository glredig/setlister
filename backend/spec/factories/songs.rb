FactoryBot.define do
  factory :song do
    title { "Bohemian Rhapsody" }
    artist { "Queen" }
    tempo { 72 }
    key { "Bb" }
    time_signature { "4/4" }
    duration { 354 }
  end
end
