class UpdateSongPerformanceConfigFields < ActiveRecord::Migration[7.1]
  def change
    remove_column :song_performance_configs, :lead_vocalist_id, :integer
    remove_column :song_performance_configs, :guitar_solo_id, :integer
    add_column :song_performance_configs, :lead_vocalist_ids, :integer, array: true, default: []
    add_column :song_performance_configs, :solos, :jsonb, default: []
  end
end
