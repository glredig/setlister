class CreateMemberSongNotes < ActiveRecord::Migration[7.1]
  def change
    create_table :member_song_notes do |t|
      t.references :member, null: false, foreign_key: true
      t.references :setlist_song, null: false, foreign_key: true
      t.text :note, null: false

      t.timestamps
    end
    add_index :member_song_notes, [:member_id, :setlist_song_id], unique: true
  end
end
