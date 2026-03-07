class CreateSongPerformanceConfigs < ActiveRecord::Migration[7.1]
  def change
    create_table :song_performance_configs do |t|
      t.references :setlist_song, null: false, foreign_key: true, index: false
      t.integer :lead_vocalist_id
      t.integer :backup_vocalist_ids, array: true, default: []
      t.integer :guitar_solo_id
      t.jsonb :instrument_overrides
      t.text :free_text_notes

      t.timestamps
    end
    add_index :song_performance_configs, :setlist_song_id, unique: true
  end
end
