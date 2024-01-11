package main

import (
	"flag"
	"karpiem/pkg/data"
	"karpiem/pkg/utils"
	"karpiem/pkg/controllers"
	"net/http"
	"log"
)

func main() {
	// Define a flag named "migrate" with a default value of false
	migrate := flag.Bool("migrate", false, "Run database migration")

	// Parse the command line arguments
	flag.Parse()
	// Initialize the CockroachDB connection with the provided migrate flag
	data.InitDB(*migrate)

	// Set up HTTP request handlers
	controllers.SetupHandlers()
	log.Println("Server is running on http://localhost:8080")

	corsHandler := func(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println("Received request with method:", r.Method)
		
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			log.Println("Responding to OPTIONS request")
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}

	// Start the server
	http.ListenAndServe(utils.GetPort(), corsHandler(http.DefaultServeMux))
}
