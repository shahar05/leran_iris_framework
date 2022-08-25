package artist

import (
	core "myapp/shared/management"
)

type Service struct {
	context *core.AppContext
}

func New(context *core.AppContext) *Service {
	return &Service{
		context: context,
	}
}

func (service *Service) GetArtists() ([]*Artist, error) {
	artists := []*Artist{}

	err := service.context.Db.Select(&artists, "SELECT * FROM artists")

	return artists, err
}

func (service *Service) CreateArtist(artist *CreateArtistModel) error {
	// TODO: Scan the new new artistID and return the full ArtistModel
	return service.context.Db.QueryRowx(`INSERT INTO artists (artist_name) VALUES ($1);`, artist.Name).Err()
}

func (service *Service) DeleteArtist(artistID string) error {
	_, err := service.context.Db.Exec(`DELETE FROM artists WHERE artist_id = $1`, artistID)
	return err
}
