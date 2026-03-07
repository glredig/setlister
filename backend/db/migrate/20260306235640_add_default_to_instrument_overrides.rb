class AddDefaultToInstrumentOverrides < ActiveRecord::Migration[7.1]
  def change
    change_column_default :song_performance_configs, :instrument_overrides, from: nil, to: {}
  end
end
