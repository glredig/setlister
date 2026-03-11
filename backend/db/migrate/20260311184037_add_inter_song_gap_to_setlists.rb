class AddInterSongGapToSetlists < ActiveRecord::Migration[7.1]
  def change
    add_column :setlists, :inter_song_gap_seconds, :integer, default: 30, null: false
  end
end
