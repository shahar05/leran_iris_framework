CREATE TABLE songs (
    song_id SERIAL NOT NULL CONSTRAINT songs_pkey PRIMARY KEY,
    song_name VARCHAR(100) NOT NULL,
    duration BIGINT NOT NULL,
    artist_id INTEGER NOT NULL CONSTRAINT songs_artists_artist_id_fk REFERENCES artists ON DELETE CASCADE,
);


CREATE TABLE artists (
    artist_id SERIAL NOT NULL CONSTRAINT artists_pkey PRIMARY KEY,
    artist_name VARCHAR(100) NOT NULL
);


CREATE TABLE playlists (
    playlist_id SERIAL NOT NULL CONSTRAINT playlists_pkey PRIMARY KEY,
    playlist_name VARCHAR(100) NOT NULL,
);


CREATE TABLE playlist_songs (
    playlist_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL CONSTRAINT playlist_songs_artists_song_id_fk REFERENCES songs ON DELETE CASCADE
);
