class CreateSetlists < ActiveRecord::Migration[7.1]
  def change
    create_table :setlists do |t|
      t.string :name
      t.date :date
      t.text :notes
      t.references :band, null: false, foreign_key: true

      t.timestamps
    end
  end
end
