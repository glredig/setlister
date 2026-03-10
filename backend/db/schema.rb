# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_03_10_161215) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "bands", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "members", force: :cascade do |t|
    t.string "name"
    t.string "instruments", default: [], array: true
    t.string "role"
    t.bigint "band_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["band_id"], name: "index_members_on_band_id"
  end

  create_table "setlist_songs", force: :cascade do |t|
    t.bigint "setlist_id", null: false
    t.bigint "song_id", null: false
    t.integer "position"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["setlist_id", "position"], name: "index_setlist_songs_on_setlist_id_and_position", unique: true
    t.index ["setlist_id", "song_id"], name: "index_setlist_songs_on_setlist_id_and_song_id", unique: true
    t.index ["setlist_id"], name: "index_setlist_songs_on_setlist_id"
    t.index ["song_id"], name: "index_setlist_songs_on_song_id"
  end

  create_table "setlists", force: :cascade do |t|
    t.string "name"
    t.date "date"
    t.text "notes"
    t.bigint "band_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["band_id"], name: "index_setlists_on_band_id"
  end

  create_table "song_performance_configs", force: :cascade do |t|
    t.bigint "setlist_song_id", null: false
    t.integer "backup_vocalist_ids", default: [], array: true
    t.jsonb "instrument_overrides", default: {}
    t.text "free_text_notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "lead_vocalist_ids", default: [], array: true
    t.jsonb "solos", default: []
    t.index ["setlist_song_id"], name: "index_song_performance_configs_on_setlist_song_id", unique: true
  end

  create_table "songs", force: :cascade do |t|
    t.string "title"
    t.string "artist"
    t.integer "tempo"
    t.string "key"
    t.string "time_signature"
    t.integer "duration"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "members", "bands"
  add_foreign_key "setlist_songs", "setlists"
  add_foreign_key "setlist_songs", "songs"
  add_foreign_key "setlists", "bands"
  add_foreign_key "song_performance_configs", "setlist_songs"
end
