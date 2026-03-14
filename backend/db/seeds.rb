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

setlist = band.setlists.create!(name: "Friday Night Set", date: Date.new(2026, 3, 20), notes: "Opening night of spring tour", inter_song_gap_seconds: 30)

[
  { song: songs[4], leads: [mike], backups: [sarah], solos: [], notes: "Start with bass riff, drums come in bar 5" },
  { song: songs[2], leads: [sarah], backups: [mike, jake], solos: [{ member_id: mike.id, instrument: "keys" }], notes: "Mike on keys for this one" },
  { song: songs[8], leads: [jake], backups: [], solos: [], notes: "Heavy intro, crowd hype" },
  { song: songs[3], leads: [mike], backups: [sarah, jake], solos: [], notes: "Full energy, keep it tight" },
  { song: songs[5], leads: [sarah], backups: [], solos: [{ member_id: jake.id, instrument: "guitar" }], notes: "Jake guitar solo, Sarah on keys" },
  { song: songs[7], leads: [mike], backups: [sarah], solos: [{ member_id: mike.id, instrument: "guitar" }], notes: "Slow it down, build to crescendo" },
  { song: songs[1], leads: [sarah], backups: [mike, jake], solos: [], notes: "Crowd singalong" },
  { song: songs[9], leads: [jake], backups: [mike], solos: [{ member_id: sarah.id, instrument: "guitar" }, { member_id: mike.id, instrument: "keys" }], notes: "Close out the main set strong" }
].each_with_index do |entry, i|
  ss = setlist.setlist_songs.create!(song: entry[:song], position: i + 1)
  ss.create_song_performance_config!(
    lead_vocalist_ids: entry[:leads].map(&:id),
    backup_vocalist_ids: entry[:backups].map(&:id),
    solos: entry[:solos],
    free_text_notes: entry[:notes]
  )
end

# Add some personal member notes
setlist.setlist_songs.each do |ss|
  MemberSongNote.create!(member: mike, setlist_song: ss, note: "Mike's note for #{ss.song.title}")
end
MemberSongNote.create!(member: sarah, setlist_song: setlist.setlist_songs.first, note: "Sarah: Remember to harmonize on chorus")

puts "Seeded: #{Band.count} band, #{Member.count} members, #{Song.count} songs, #{Setlist.count} setlist with #{SetlistSong.count} songs, #{MemberSongNote.count} member notes"
