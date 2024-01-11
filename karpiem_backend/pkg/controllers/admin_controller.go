package controllers

import (
	"net/http"
	"log"
)
func AdminViewHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Admin view handler")
	http.ServeFile(w, r, "./pkg/views/admin.html")
}