package artist

import (
	core "myapp/shared/management"

	"github.com/kataras/golog"
	"github.com/kataras/iris/v12"
)

func RegisterArtistRouter(server *iris.Application, context *core.AppContext) {
	service := New(context)

	a := server.Party("artist")
	{
		a.Get("/", func(ctx iris.Context) {

			resp, err := service.GetArtists()

			if err != nil {
				golog.Errorf("get-users: failed to get users. %s", err)
				ctx.StatusCode(iris.StatusInternalServerError)
				return
			}

			ctx.JSON(resp)

		})

		a.Post("/", func(ctx iris.Context) {
			var req CreateArtistModel

			if err := ctx.ReadJSON(&req); err != nil {
				golog.Error(err)
				ctx.StatusCode(iris.StatusBadRequest)
				return
			}

			err := service.CreateArtist(&req)

			if err != nil {
				golog.Errorf("create artist failed. error: %s", err)
				ctx.StatusCode(iris.StatusInternalServerError)
				return
			}

			ctx.JSON(nil)
		})

		a.Delete("/{artist_id}", func(ctx iris.Context) {
			artistID := ctx.Params().Get("artist_id")

			err := service.DeleteArtist(artistID)

			if err != nil {
				golog.Errorf("delate artist failed. error: %s", err)
				ctx.StatusCode(iris.StatusInternalServerError)
				return
			}

			ctx.JSON(nil)
		})

	}
}
