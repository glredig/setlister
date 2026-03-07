class CreateSongs < ActiveRecord::Migration[7.1]
  def change
    create_table :songs do |t|
      t.string :title
      t.string :artist
      t.integer :tempo
      t.string :key
      t.string :time_signature
      t.integer :duration

      t.timestamps
    end
  end
end
