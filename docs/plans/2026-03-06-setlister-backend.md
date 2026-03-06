# Setlister Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Rails API backend for setlister Phase 1 (creation/editing) — models, migrations, endpoints, and tests.

**Architecture:** Rails 7 API-mode app with PostgreSQL. RESTful JSON endpoints for bands, members, songs (read from existing table), setlists, and a bulk update endpoint for setlist songs with performance configs.

**Tech Stack:** Ruby on Rails 7 (API mode), PostgreSQL, RSpec, FactoryBot

---

### Task 1: Rails API App Scaffold

**Files:**
- Create: `backend/` (new Rails app directory)

**Step 1: Generate Rails API app**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister
rails new backend --api --database=postgresql --skip-javascript --skip-asset-pipeline -T
```

Expected: New Rails API app in `backend/` directory.

**Step 2: Add testing gems**

Modify: `backend/Gemfile` — add to the `:development, :test` group:

```ruby
group :development, :test do
  gem "rspec-rails", "~> 7.0"
  gem "factory_bot_rails"
end
```

**Step 3: Install dependencies and set up RSpec**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
bundle install
rails generate rspec:install
```

Expected: `spec/` directory created with `spec_helper.rb` and `rails_helper.rb`.

**Step 4: Configure FactoryBot**

Modify: `backend/spec/rails_helper.rb` — add inside the `RSpec.configure` block:

```ruby
config.include FactoryBot::Syntax::Methods
```

**Step 5: Create and verify database**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:create
```

Expected: Development and test databases created.

**Step 6: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: scaffold Rails API app with RSpec and FactoryBot"
```

---

### Task 2: Band Model, Migration, and Tests

**Files:**
- Create: `backend/spec/models/band_spec.rb`
- Create: `backend/spec/factories/bands.rb`
- Create: `backend/app/models/band.rb`
- Create: `backend/db/migrate/..._create_bands.rb`

**Step 1: Generate the model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails generate model Band name:string
```

**Step 2: Write the failing test**

Replace `backend/spec/models/band_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe Band, type: :model do
  describe "validations" do
    it "is valid with a name" do
      band = build(:band, name: "The Originals")
      expect(band).to be_valid
    end

    it "is invalid without a name" do
      band = build(:band, name: nil)
      expect(band).not_to be_valid
    end

    it "is invalid with a blank name" do
      band = build(:band, name: "")
      expect(band).not_to be_valid
    end
  end

  describe "associations" do
    it "has many members" do
      association = described_class.reflect_on_association(:members)
      expect(association.macro).to eq(:has_many)
    end

    it "has many setlists" do
      association = described_class.reflect_on_association(:setlists)
      expect(association.macro).to eq(:has_many)
    end
  end
end
```

Create `backend/spec/factories/bands.rb`:

```ruby
FactoryBot.define do
  factory :band do
    name { "The Originals" }
  end
end
```

**Step 3: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/band_spec.rb -v`

Expected: FAIL — validation and association tests fail.

**Step 4: Run migration and implement model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:migrate
```

Replace `backend/app/models/band.rb`:

```ruby
class Band < ApplicationRecord
  has_many :members, dependent: :destroy
  has_many :setlists, dependent: :destroy

  validates :name, presence: true
end
```

**Step 5: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/band_spec.rb -v`

Expected: PASS (association tests will fail until Member/Setlist models exist — that's expected, we'll revisit).

**Step 6: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add Band model with validations"
```

---

### Task 3: Member Model, Migration, and Tests

**Files:**
- Create: `backend/spec/models/member_spec.rb`
- Create: `backend/spec/factories/members.rb`
- Create: `backend/app/models/member.rb`
- Create: `backend/db/migrate/..._create_members.rb`

**Step 1: Generate the model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails generate model Member name:string instruments:string role:string band:references
```

Note: `instruments` is stored as a string array in PostgreSQL. We'll update the migration to use an array column.

**Step 2: Update migration for array column**

Modify the generated migration file — change the `instruments` line to:

```ruby
t.string :instruments, array: true, default: []
```

And add a validation for role as an enum or string check.

**Step 3: Write the failing test**

Replace `backend/spec/models/member_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe Member, type: :model do
  describe "validations" do
    it "is valid with all attributes" do
      member = build(:member)
      expect(member).to be_valid
    end

    it "is invalid without a name" do
      member = build(:member, name: nil)
      expect(member).not_to be_valid
    end

    it "is invalid without a role" do
      member = build(:member, role: nil)
      expect(member).not_to be_valid
    end

    it "is invalid with an unknown role" do
      member = build(:member, role: "roadie")
      expect(member).not_to be_valid
    end

    it "is valid as band_member" do
      member = build(:member, role: "band_member")
      expect(member).to be_valid
    end

    it "is valid as engineer" do
      member = build(:member, role: "engineer")
      expect(member).to be_valid
    end
  end

  describe "associations" do
    it "belongs to a band" do
      association = described_class.reflect_on_association(:band)
      expect(association.macro).to eq(:belongs_to)
    end
  end

  describe "instruments" do
    it "stores multiple instruments as an array" do
      member = create(:member, instruments: ["guitar", "keys"])
      member.reload
      expect(member.instruments).to eq(["guitar", "keys"])
    end
  end
end
```

Create `backend/spec/factories/members.rb`:

```ruby
FactoryBot.define do
  factory :member do
    name { "Mike" }
    instruments { ["guitar", "vocals"] }
    role { "band_member" }
    band
  end
end
```

**Step 4: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/member_spec.rb -v`

Expected: FAIL

**Step 5: Run migration and implement model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:migrate
```

Replace `backend/app/models/member.rb`:

```ruby
class Member < ApplicationRecord
  belongs_to :band

  VALID_ROLES = %w[band_member engineer].freeze

  validates :name, presence: true
  validates :role, presence: true, inclusion: { in: VALID_ROLES }
end
```

**Step 6: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/member_spec.rb -v`

Expected: ALL PASS

**Step 7: Re-run Band specs to confirm association tests pass**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/band_spec.rb -v`

Expected: `has many members` now passes.

**Step 8: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add Member model with instruments array and role validation"
```

---

### Task 4: Song Model and Tests

The Song model points to the existing marketing site's `songs` table. It's read-only from setlister's perspective.

**Files:**
- Create: `backend/spec/models/song_spec.rb`
- Create: `backend/spec/factories/songs.rb`
- Create: `backend/app/models/song.rb`
- Create: `backend/db/migrate/..._create_songs.rb` (for dev/test — production uses shared table)

**Step 1: Generate migration for dev/test**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails generate model Song title:string artist:string tempo:integer key:string time_signature:string duration:integer
```

Note: In production, this table already exists (from the marketing site). This migration is for dev/test environments only. Add a comment to the migration:

```ruby
# This table exists on the marketing site's DB in production.
# This migration creates it for development/test environments only.
```

**Step 2: Write the failing test**

Replace `backend/spec/models/song_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe Song, type: :model do
  describe "validations" do
    it "is valid with title and artist" do
      song = build(:song)
      expect(song).to be_valid
    end

    it "is invalid without a title" do
      song = build(:song, title: nil)
      expect(song).not_to be_valid
    end

    it "is invalid without an artist" do
      song = build(:song, artist: nil)
      expect(song).not_to be_valid
    end
  end

  describe "scopes" do
    before do
      create(:song, title: "Bohemian Rhapsody", artist: "Queen", tempo: 72, key: "Bb")
      create(:song, title: "Don't Stop Me Now", artist: "Queen", tempo: 156, key: "F")
      create(:song, title: "Superstition", artist: "Stevie Wonder", tempo: 101, key: "Ebm")
    end

    it "searches by title" do
      results = Song.search("Bohemian")
      expect(results.count).to eq(1)
      expect(results.first.title).to eq("Bohemian Rhapsody")
    end

    it "searches by artist" do
      results = Song.search("Queen")
      expect(results.count).to eq(2)
    end

    it "search is case-insensitive" do
      results = Song.search("bohemian")
      expect(results.count).to eq(1)
    end

    it "filters by key" do
      results = Song.where(key: "F")
      expect(results.count).to eq(1)
      expect(results.first.title).to eq("Don't Stop Me Now")
    end
  end
end
```

Create `backend/spec/factories/songs.rb`:

```ruby
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
```

**Step 3: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/song_spec.rb -v`

Expected: FAIL — no `search` scope defined.

**Step 4: Run migration and implement model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:migrate
```

Replace `backend/app/models/song.rb`:

```ruby
class Song < ApplicationRecord
  validates :title, presence: true
  validates :artist, presence: true

  scope :search, ->(query) {
    where("title ILIKE :q OR artist ILIKE :q", q: "%#{query}%")
  }
end
```

**Step 5: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/song_spec.rb -v`

Expected: ALL PASS

**Step 6: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add Song model with search scope"
```

---

### Task 5: Setlist Model, Migration, and Tests

**Files:**
- Create: `backend/spec/models/setlist_spec.rb`
- Create: `backend/spec/factories/setlists.rb`
- Create: `backend/app/models/setlist.rb`
- Create: `backend/db/migrate/..._create_setlists.rb`

**Step 1: Generate the model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails generate model Setlist name:string date:date notes:text band:references
```

**Step 2: Write the failing test**

Replace `backend/spec/models/setlist_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe Setlist, type: :model do
  describe "validations" do
    it "is valid with a name and band" do
      setlist = build(:setlist)
      expect(setlist).to be_valid
    end

    it "is invalid without a name" do
      setlist = build(:setlist, name: nil)
      expect(setlist).not_to be_valid
    end
  end

  describe "associations" do
    it "belongs to a band" do
      association = described_class.reflect_on_association(:band)
      expect(association.macro).to eq(:belongs_to)
    end

    it "has many setlist_songs" do
      association = described_class.reflect_on_association(:setlist_songs)
      expect(association.macro).to eq(:has_many)
    end

    it "has many songs through setlist_songs" do
      association = described_class.reflect_on_association(:songs)
      expect(association.macro).to eq(:has_many)
    end
  end
end
```

Create `backend/spec/factories/setlists.rb`:

```ruby
FactoryBot.define do
  factory :setlist do
    name { "Friday Night Set" }
    date { Date.today }
    notes { "" }
    band
  end
end
```

**Step 3: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/setlist_spec.rb -v`

Expected: FAIL

**Step 4: Run migration and implement model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:migrate
```

Replace `backend/app/models/setlist.rb`:

```ruby
class Setlist < ApplicationRecord
  belongs_to :band
  has_many :setlist_songs, -> { order(:position) }, dependent: :destroy
  has_many :songs, through: :setlist_songs

  validates :name, presence: true
end
```

**Step 5: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/setlist_spec.rb -v`

Expected: ALL PASS (setlist_songs association test may fail until Task 6 — expected).

**Step 6: Re-run Band specs**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/band_spec.rb -v`

Expected: `has many setlists` now passes.

**Step 7: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add Setlist model with band association"
```

---

### Task 6: SetlistSong Model, Migration, and Tests

**Files:**
- Create: `backend/spec/models/setlist_song_spec.rb`
- Create: `backend/spec/factories/setlist_songs.rb`
- Create: `backend/app/models/setlist_song.rb`
- Create: `backend/db/migrate/..._create_setlist_songs.rb`

**Step 1: Generate the model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails generate model SetlistSong setlist:references song:references position:integer
```

**Step 2: Add unique index to migration**

Modify the generated migration — add after the `create_table` block:

```ruby
add_index :setlist_songs, [:setlist_id, :position], unique: true
add_index :setlist_songs, [:setlist_id, :song_id], unique: true
```

**Step 3: Write the failing test**

Replace `backend/spec/models/setlist_song_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe SetlistSong, type: :model do
  describe "validations" do
    it "is valid with all attributes" do
      setlist_song = build(:setlist_song)
      expect(setlist_song).to be_valid
    end

    it "is invalid without a position" do
      setlist_song = build(:setlist_song, position: nil)
      expect(setlist_song).not_to be_valid
    end

    it "requires unique position within a setlist" do
      setlist = create(:setlist)
      create(:setlist_song, setlist: setlist, position: 1)
      duplicate = build(:setlist_song, setlist: setlist, position: 1)
      expect(duplicate).not_to be_valid
    end

    it "allows same position in different setlists" do
      song = create(:song)
      setlist_song_1 = create(:setlist_song, position: 1, song: song)
      setlist_song_2 = build(:setlist_song, position: 1, song: song)
      expect(setlist_song_2).to be_valid
    end
  end

  describe "associations" do
    it "belongs to a setlist" do
      association = described_class.reflect_on_association(:setlist)
      expect(association.macro).to eq(:belongs_to)
    end

    it "belongs to a song" do
      association = described_class.reflect_on_association(:song)
      expect(association.macro).to eq(:belongs_to)
    end

    it "has one song_performance_config" do
      association = described_class.reflect_on_association(:song_performance_config)
      expect(association.macro).to eq(:has_one)
    end
  end
end
```

Create `backend/spec/factories/setlist_songs.rb`:

```ruby
FactoryBot.define do
  factory :setlist_song do
    setlist
    song
    position { 1 }
  end
end
```

**Step 4: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/setlist_song_spec.rb -v`

Expected: FAIL

**Step 5: Run migration and implement model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:migrate
```

Replace `backend/app/models/setlist_song.rb`:

```ruby
class SetlistSong < ApplicationRecord
  belongs_to :setlist
  belongs_to :song
  has_one :song_performance_config, dependent: :destroy

  validates :position, presence: true,
    uniqueness: { scope: :setlist_id }
end
```

**Step 6: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/setlist_song_spec.rb -v`

Expected: ALL PASS (song_performance_config association may fail until Task 7).

**Step 7: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add SetlistSong join model with position ordering"
```

---

### Task 7: SongPerformanceConfig Model, Migration, and Tests

**Files:**
- Create: `backend/spec/models/song_performance_config_spec.rb`
- Create: `backend/spec/factories/song_performance_configs.rb`
- Create: `backend/app/models/song_performance_config.rb`
- Create: `backend/db/migrate/..._create_song_performance_configs.rb`

**Step 1: Generate the model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails generate model SongPerformanceConfig setlist_song:references lead_vocalist_id:integer backup_vocalist_ids:integer guitar_solo_id:integer instrument_overrides:jsonb free_text_notes:text
```

**Step 2: Update migration for array column**

Modify the generated migration — change `backup_vocalist_ids` to:

```ruby
t.integer :backup_vocalist_ids, array: true, default: []
```

And add a unique index:

```ruby
add_index :song_performance_configs, :setlist_song_id, unique: true
```

**Step 3: Write the failing test**

Replace `backend/spec/models/song_performance_config_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe SongPerformanceConfig, type: :model do
  describe "validations" do
    it "is valid with just a setlist_song" do
      config = build(:song_performance_config)
      expect(config).to be_valid
    end
  end

  describe "associations" do
    it "belongs to a setlist_song" do
      association = described_class.reflect_on_association(:setlist_song)
      expect(association.macro).to eq(:belongs_to)
    end
  end

  describe "optional fields" do
    it "stores lead vocalist id" do
      member = create(:member)
      config = create(:song_performance_config, lead_vocalist_id: member.id)
      config.reload
      expect(config.lead_vocalist_id).to eq(member.id)
    end

    it "stores backup vocalist ids as array" do
      members = create_list(:member, 2)
      config = create(:song_performance_config, backup_vocalist_ids: members.map(&:id))
      config.reload
      expect(config.backup_vocalist_ids).to eq(members.map(&:id))
    end

    it "stores instrument overrides as JSON" do
      member = create(:member)
      overrides = { member.id.to_s => "keys" }
      config = create(:song_performance_config, instrument_overrides: overrides)
      config.reload
      expect(config.instrument_overrides).to eq(overrides)
    end

    it "stores free text notes" do
      config = create(:song_performance_config, free_text_notes: "Start with piano intro")
      config.reload
      expect(config.free_text_notes).to eq("Start with piano intro")
    end
  end
end
```

Create `backend/spec/factories/song_performance_configs.rb`:

```ruby
FactoryBot.define do
  factory :song_performance_config do
    setlist_song
    lead_vocalist_id { nil }
    backup_vocalist_ids { [] }
    guitar_solo_id { nil }
    instrument_overrides { {} }
    free_text_notes { "" }
  end
end
```

**Step 4: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/song_performance_config_spec.rb -v`

Expected: FAIL

**Step 5: Run migration and implement model**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:migrate
```

Replace `backend/app/models/song_performance_config.rb`:

```ruby
class SongPerformanceConfig < ApplicationRecord
  belongs_to :setlist_song
end
```

**Step 6: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/models/song_performance_config_spec.rb -v`

Expected: ALL PASS

**Step 7: Run full test suite**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec -v`

Expected: ALL PASS — all models and associations are now in place.

**Step 8: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add SongPerformanceConfig model with JSONB instrument overrides"
```

---

### Task 8: Bands Controller and Tests

**Files:**
- Create: `backend/spec/requests/bands_spec.rb`
- Create: `backend/app/controllers/api/bands_controller.rb`
- Create: `backend/config/routes.rb` (modify)

**Step 1: Write the failing request specs**

Create `backend/spec/requests/bands_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Bands API", type: :request do
  describe "GET /api/bands/:id" do
    it "returns the band with members" do
      band = create(:band)
      member = create(:member, band: band)

      get "/api/bands/#{band.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq(band.name)
      expect(json["members"].length).to eq(1)
      expect(json["members"][0]["name"]).to eq(member.name)
      expect(json["members"][0]["instruments"]).to eq(member.instruments)
    end

    it "returns 404 for non-existent band" do
      get "/api/bands/999"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PUT /api/bands/:id" do
    it "updates the band name" do
      band = create(:band, name: "Old Name")

      put "/api/bands/#{band.id}", params: { band: { name: "New Name" } }

      expect(response).to have_http_status(:ok)
      expect(band.reload.name).to eq("New Name")
    end

    it "returns errors for invalid update" do
      band = create(:band)

      put "/api/bands/#{band.id}", params: { band: { name: "" } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/bands_spec.rb -v`

Expected: FAIL — no routes or controller.

**Step 3: Set up routes**

Replace `backend/config/routes.rb`:

```ruby
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
end
```

**Step 4: Create controller directory and implement**

Run:
```bash
mkdir -p /Users/gabrielredig/code/react_projects/setlister/backend/app/controllers/api
```

Create `backend/app/controllers/api/bands_controller.rb`:

```ruby
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
```

**Step 5: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/bands_spec.rb -v`

Expected: ALL PASS

**Step 6: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add Bands API controller with show and update"
```

---

### Task 9: Members Controller and Tests

**Files:**
- Create: `backend/spec/requests/members_spec.rb`
- Create: `backend/app/controllers/api/members_controller.rb`

**Step 1: Write the failing request specs**

Create `backend/spec/requests/members_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Members API", type: :request do
  describe "POST /api/bands/:band_id/members" do
    it "creates a new member" do
      band = create(:band)

      post "/api/bands/#{band.id}/members", params: {
        member: { name: "Jake", instruments: ["guitar", "keys"], role: "band_member" }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("Jake")
      expect(json["instruments"]).to eq(["guitar", "keys"])
    end

    it "returns errors for invalid member" do
      band = create(:band)

      post "/api/bands/#{band.id}/members", params: {
        member: { name: "", role: "band_member" }
      }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "PUT /api/members/:id" do
    it "updates the member" do
      member = create(:member, name: "Old Name")

      put "/api/members/#{member.id}", params: {
        member: { name: "New Name" }
      }

      expect(response).to have_http_status(:ok)
      expect(member.reload.name).to eq("New Name")
    end
  end

  describe "DELETE /api/members/:id" do
    it "deletes the member" do
      member = create(:member)

      delete "/api/members/#{member.id}"

      expect(response).to have_http_status(:no_content)
      expect(Member.find_by(id: member.id)).to be_nil
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/members_spec.rb -v`

Expected: FAIL

**Step 3: Implement controller**

Create `backend/app/controllers/api/members_controller.rb`:

```ruby
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
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/members_spec.rb -v`

Expected: ALL PASS

**Step 5: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add Members API controller with CRUD"
```

---

### Task 10: Songs Controller and Tests

**Files:**
- Create: `backend/spec/requests/songs_spec.rb`
- Create: `backend/app/controllers/api/songs_controller.rb`

**Step 1: Write the failing request specs**

Create `backend/spec/requests/songs_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Songs API", type: :request do
  let(:band) { create(:band) }

  describe "GET /api/bands/:band_id/songs" do
    before do
      create(:song, title: "Bohemian Rhapsody", artist: "Queen", tempo: 72, key: "Bb")
      create(:song, title: "Don't Stop Me Now", artist: "Queen", tempo: 156, key: "F")
      create(:song, title: "Superstition", artist: "Stevie Wonder", tempo: 101, key: "Ebm")
    end

    it "returns all songs" do
      get "/api/bands/#{band.id}/songs"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(3)
    end

    it "filters by search query" do
      get "/api/bands/#{band.id}/songs", params: { q: "Queen" }

      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
    end

    it "filters by key" do
      get "/api/bands/#{band.id}/songs", params: { key: "F" }

      json = JSON.parse(response.body)
      expect(json.length).to eq(1)
      expect(json[0]["title"]).to eq("Don't Stop Me Now")
    end

    it "filters by minimum tempo" do
      get "/api/bands/#{band.id}/songs", params: { tempo_min: 100 }

      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
    end
  end

  describe "POST /api/bands/:band_id/songs" do
    it "creates a song" do
      post "/api/bands/#{band.id}/songs", params: {
        song: { title: "New Song", artist: "New Artist", tempo: 120, key: "C", time_signature: "4/4", duration: 210 }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["title"]).to eq("New Song")
    end
  end

  describe "PUT /api/songs/:id" do
    it "updates a song" do
      song = create(:song)

      put "/api/songs/#{song.id}", params: { song: { tempo: 140 } }

      expect(response).to have_http_status(:ok)
      expect(song.reload.tempo).to eq(140)
    end
  end

  describe "DELETE /api/songs/:id" do
    it "deletes a song" do
      song = create(:song)

      delete "/api/songs/#{song.id}"

      expect(response).to have_http_status(:no_content)
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/songs_spec.rb -v`

Expected: FAIL

**Step 3: Implement controller**

Create `backend/app/controllers/api/songs_controller.rb`:

```ruby
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
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/songs_spec.rb -v`

Expected: ALL PASS

**Step 5: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add Songs API controller with search and filter"
```

---

### Task 11: Setlists Controller and Tests

**Files:**
- Create: `backend/spec/requests/setlists_spec.rb`
- Create: `backend/app/controllers/api/setlists_controller.rb`

**Step 1: Write the failing request specs**

Create `backend/spec/requests/setlists_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Setlists API", type: :request do
  let(:band) { create(:band) }

  describe "GET /api/bands/:band_id/setlists" do
    it "returns all setlists for a band" do
      create(:setlist, band: band, name: "Friday Set")
      create(:setlist, band: band, name: "Saturday Set")

      get "/api/bands/#{band.id}/setlists"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
    end
  end

  describe "POST /api/bands/:band_id/setlists" do
    it "creates a setlist" do
      post "/api/bands/#{band.id}/setlists", params: {
        setlist: { name: "New Set", date: "2026-03-15", notes: "Opening night" }
      }

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq("New Set")
    end
  end

  describe "GET /api/setlists/:id" do
    it "returns the setlist with songs and performance configs" do
      setlist = create(:setlist, band: band)
      song = create(:song, title: "Test Song", tempo: 120)
      setlist_song = create(:setlist_song, setlist: setlist, song: song, position: 1)
      member = create(:member, band: band)
      create(:song_performance_config,
        setlist_song: setlist_song,
        lead_vocalist_id: member.id,
        free_text_notes: "Start soft"
      )

      get "/api/setlists/#{setlist.id}"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["name"]).to eq(setlist.name)
      expect(json["setlist_songs"].length).to eq(1)
      expect(json["setlist_songs"][0]["song"]["title"]).to eq("Test Song")
      expect(json["setlist_songs"][0]["song_performance_config"]["lead_vocalist_id"]).to eq(member.id)
      expect(json["setlist_songs"][0]["song_performance_config"]["free_text_notes"]).to eq("Start soft")
    end
  end

  describe "PUT /api/setlists/:id" do
    it "updates setlist metadata" do
      setlist = create(:setlist, band: band)

      put "/api/setlists/#{setlist.id}", params: { setlist: { name: "Updated Name" } }

      expect(response).to have_http_status(:ok)
      expect(setlist.reload.name).to eq("Updated Name")
    end
  end

  describe "DELETE /api/setlists/:id" do
    it "deletes the setlist and associated songs" do
      setlist = create(:setlist, band: band)
      song = create(:song)
      create(:setlist_song, setlist: setlist, song: song, position: 1)

      delete "/api/setlists/#{setlist.id}"

      expect(response).to have_http_status(:no_content)
      expect(Setlist.find_by(id: setlist.id)).to be_nil
      expect(SetlistSong.where(setlist_id: setlist.id)).to be_empty
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/setlists_spec.rb -v`

Expected: FAIL

**Step 3: Implement controller**

Create `backend/app/controllers/api/setlists_controller.rb`:

```ruby
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
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/setlists_spec.rb -v`

Expected: ALL PASS

**Step 5: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add Setlists API controller with nested song/config JSON"
```

---

### Task 12: Setlist Songs Bulk Update Endpoint and Tests

This is the key endpoint — one API call to save the entire setlist state (song order + performance configs).

**Files:**
- Create: `backend/spec/requests/setlist_songs_spec.rb`
- Create: `backend/app/controllers/api/setlist_songs_controller.rb`

**Step 1: Write the failing request specs**

Create `backend/spec/requests/setlist_songs_spec.rb`:

```ruby
require "rails_helper"

RSpec.describe "Setlist Songs Bulk Update API", type: :request do
  let(:band) { create(:band) }
  let(:setlist) { create(:setlist, band: band) }
  let(:member) { create(:member, band: band) }

  describe "PUT /api/setlists/:id/songs" do
    it "replaces all songs in a setlist" do
      song1 = create(:song, title: "Song A")
      song2 = create(:song, title: "Song B")

      put "/api/setlists/#{setlist.id}/songs", params: {
        songs: [
          { song_id: song1.id, position: 1, performance_config: { lead_vocalist_id: member.id } },
          { song_id: song2.id, position: 2, performance_config: { free_text_notes: "Big finish" } }
        ]
      }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["setlist_songs"].length).to eq(2)
      expect(json["setlist_songs"][0]["song"]["title"]).to eq("Song A")
      expect(json["setlist_songs"][0]["song_performance_config"]["lead_vocalist_id"]).to eq(member.id)
      expect(json["setlist_songs"][1]["song"]["title"]).to eq("Song B")
      expect(json["setlist_songs"][1]["song_performance_config"]["free_text_notes"]).to eq("Big finish")
    end

    it "removes songs not included in the update" do
      song1 = create(:song)
      song2 = create(:song)
      create(:setlist_song, setlist: setlist, song: song1, position: 1)
      create(:setlist_song, setlist: setlist, song: song2, position: 2)

      put "/api/setlists/#{setlist.id}/songs", params: {
        songs: [
          { song_id: song1.id, position: 1, performance_config: {} }
        ]
      }

      expect(response).to have_http_status(:ok)
      expect(setlist.setlist_songs.count).to eq(1)
    end

    it "reorders songs" do
      song1 = create(:song, title: "First")
      song2 = create(:song, title: "Second")
      create(:setlist_song, setlist: setlist, song: song1, position: 1)
      create(:setlist_song, setlist: setlist, song: song2, position: 2)

      put "/api/setlists/#{setlist.id}/songs", params: {
        songs: [
          { song_id: song2.id, position: 1, performance_config: {} },
          { song_id: song1.id, position: 2, performance_config: {} }
        ]
      }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["setlist_songs"][0]["song"]["title"]).to eq("Second")
      expect(json["setlist_songs"][1]["song"]["title"]).to eq("First")
    end

    it "handles an empty setlist" do
      create(:setlist_song, setlist: setlist, song: create(:song), position: 1)

      put "/api/setlists/#{setlist.id}/songs", params: { songs: [] }

      expect(response).to have_http_status(:ok)
      expect(setlist.setlist_songs.count).to eq(0)
    end
  end
end
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/setlist_songs_spec.rb -v`

Expected: FAIL

**Step 3: Implement controller**

Create `backend/app/controllers/api/setlist_songs_controller.rb`:

```ruby
module Api
  class SetlistSongsController < ApplicationController
    def bulk_update
      setlist = Setlist.find(params[:id])

      ActiveRecord::Base.transaction do
        setlist.setlist_songs.destroy_all

        (params[:songs] || []).each do |song_entry|
          setlist_song = setlist.setlist_songs.create!(
            song_id: song_entry[:song_id],
            position: song_entry[:position]
          )

          config_params = song_entry[:performance_config] || {}
          setlist_song.create_song_performance_config!(
            lead_vocalist_id: config_params[:lead_vocalist_id],
            backup_vocalist_ids: config_params[:backup_vocalist_ids] || [],
            guitar_solo_id: config_params[:guitar_solo_id],
            instrument_overrides: config_params[:instrument_overrides] || {},
            free_text_notes: config_params[:free_text_notes] || ""
          )
        end
      end

      setlist.reload
      render json: setlist_json(setlist)
    end

    private

    def setlist_json(setlist)
      setlist.as_json(
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
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/gabrielredig/code/react_projects/setlister/backend && bundle exec rspec spec/requests/setlist_songs_spec.rb -v`

Expected: ALL PASS

**Step 5: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add bulk update endpoint for setlist songs with performance configs"
```

---

### Task 13: Seed Data for Development

**Files:**
- Modify: `backend/db/seeds.rb`

**Step 1: Write seed data**

Replace `backend/db/seeds.rb`:

```ruby
band = Band.create!(name: "The Originals")

mike = band.members.create!(name: "Mike", instruments: ["guitar", "vocals", "keys"], role: "band_member")
sarah = band.members.create!(name: "Sarah", instruments: ["guitar", "vocals", "keys"], role: "band_member")
jake = band.members.create!(name: "Jake", instruments: ["bass", "vocals"], role: "band_member")
dave = band.members.create!(name: "Dave", instruments: ["drums"], role: "band_member")
chris = band.members.create!(name: "Chris", instruments: [], role: "engineer")

songs_data = [
  { title: "Bohemian Rhapsody", artist: "Queen", tempo: 72, key: "Bb", time_signature: "4/4", duration: 354 },
  { title: "Don't Stop Me Now", artist: "Queen", tempo: 156, key: "F", time_signature: "4/4", duration: 209 },
  { title: "Superstition", artist: "Stevie Wonder", tempo: 101, key: "Ebm", time_signature: "4/4", duration: 245 },
  { title: "September", artist: "Earth, Wind & Fire", tempo: 126, key: "Ab", time_signature: "4/4", duration: 215 },
  { title: "Come Together", artist: "The Beatles", tempo: 82, key: "Dm", time_signature: "4/4", duration: 259 },
  { title: "Crazy Train", artist: "Ozzy Osbourne", tempo: 138, key: "F#m", time_signature: "4/4", duration: 295 },
  { title: "Under Pressure", artist: "Queen & David Bowie", tempo: 148, key: "D", time_signature: "4/4", duration: 248 },
  { title: "Purple Rain", artist: "Prince", tempo: 113, key: "Bb", time_signature: "4/4", duration: 521 },
  { title: "Killing in the Name", artist: "Rage Against the Machine", tempo: 86, key: "Dm", time_signature: "4/4", duration: 312 },
  { title: "Mr. Brightside", artist: "The Killers", tempo: 148, key: "Bb", time_signature: "4/4", duration: 222 }
]

songs = songs_data.map { |data| Song.create!(data) }

setlist = band.setlists.create!(name: "Friday Night Set", date: Date.new(2026, 3, 20), notes: "Opening night of spring tour")

[
  { song: songs[4], lead: mike, backups: [sarah], notes: "Start with bass riff, drums come in bar 5" },
  { song: songs[2], lead: sarah, backups: [mike, jake], notes: "Mike on keys for this one" },
  { song: songs[8], lead: jake, backups: [], notes: "Heavy intro, crowd hype" },
  { song: songs[3], lead: mike, backups: [sarah, jake], notes: "Full energy, keep it tight" },
  { song: songs[5], lead: sarah, backups: [], notes: "Jake guitar solo, Sarah on keys" },
  { song: songs[7], lead: mike, backups: [sarah], notes: "Slow it down, build to crescendo" },
  { song: songs[1], lead: sarah, backups: [mike, jake], notes: "Crowd singalong" },
  { song: songs[9], lead: jake, backups: [mike], notes: "Close out the main set strong" }
].each_with_index do |entry, i|
  ss = setlist.setlist_songs.create!(song: entry[:song], position: i + 1)
  ss.create_song_performance_config!(
    lead_vocalist_id: entry[:lead].id,
    backup_vocalist_ids: entry[:backups].map(&:id),
    free_text_notes: entry[:notes]
  )
end

puts "Seeded: #{Band.count} band, #{Member.count} members, #{Song.count} songs, #{Setlist.count} setlist with #{SetlistSong.count} songs"
```

**Step 2: Run the seed**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails db:seed
```

Expected: Output showing counts of seeded records.

**Step 3: Verify with rails console**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails runner "puts Setlist.first.setlist_songs.includes(:song).map { |ss| \"#{ss.position}. #{ss.song.title}\" }"
```

Expected: Numbered list of 8 songs in order.

**Step 4: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add seed data with band, members, songs, and sample setlist"
```

---

### Task 14: CORS Configuration

The Next.js frontend will run on a different port/domain. Rails needs CORS headers.

**Files:**
- Modify: `backend/Gemfile`
- Create: `backend/config/initializers/cors.rb`

**Step 1: Add rack-cors gem**

Add to `backend/Gemfile`:

```ruby
gem "rack-cors"
```

**Step 2: Install and configure**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
bundle install
```

Create `backend/config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "http://localhost:3000", "http://localhost:3001"

    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

**Step 3: Commit**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git add backend/
git commit -m "feat: add CORS configuration for frontend dev server"
```

---

### Task 15: Full Test Suite Verification

**Step 1: Run the complete test suite**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
bundle exec rspec -v
```

Expected: ALL PASS — all model and request specs green.

**Step 2: Verify API manually with curl**

Run:
```bash
cd /Users/gabrielredig/code/react_projects/setlister/backend
rails server -p 3001 -d
sleep 2
curl -s http://localhost:3001/api/bands/1 | ruby -rjson -e 'puts JSON.pretty_generate(JSON.parse(STDIN.read))'
kill $(cat tmp/pids/server.pid)
```

Expected: JSON response with band name and members array.

**Step 3: Commit any fixes if needed, then tag completion**

```bash
cd /Users/gabrielredig/code/react_projects/setlister
git log --oneline
```

Verify all commits are present. Backend Phase 1 is complete.
