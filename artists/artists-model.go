package artist

type Artist struct {
	Id   string `db:"artist_id" json:"artistId"`
	Name string `db:"artist_name" json:"name"`
}

type CreateArtistModel struct {
	Name string `db:"artist_name" json:"name"`
}
