package api

import (
	"net/http"
	"os"
)

func mockupFileServer() http.Handler {
	for _, dir := range []string{
		"../nearu-web/public/mockup",
		"nearu-web/public/mockup",
		"../nearu-web-backup-20260720-103121/public/mockup",
	} {
		if info, err := os.Stat(dir); err == nil && info.IsDir() {
			return http.StripPrefix("/mockup/", http.FileServer(http.Dir(dir)))
		}
	}
	return http.NotFoundHandler()
}
