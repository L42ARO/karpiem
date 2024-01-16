package main

import (
	"fmt"
	"net/http"
	"time"
)

var stopChan chan bool
var focusRunning bool
func main() {
	// Your HTTP routes
	http.HandleFunc("/start", func(w http.ResponseWriter, r *http.Request) {
		// Start the goroutine to update currFocusTime and print it
		//Open the channel
		if focusRunning {
			fmt.Fprintf(w, "Focus is already running")
			return
		}
		focusRunning = true
		stopChan = make(chan bool)
		go updateAndPrint()
		fmt.Fprintf(w, "Starting the goroutine")
	})

	http.HandleFunc("/stop", func(w http.ResponseWriter, r *http.Request) {
		// Stop the goroutine by closing the stopChan
		if !focusRunning {
			fmt.Fprintf(w, "Focus is not running")
			return
		}
		close(stopChan)
		fmt.Fprintf(w, "Stopping the goroutine")
	})
	fmt.Println("Server is running on http://localhost:5000")
	// Start the HTTP server
	http.ListenAndServe(":5000", nil)
}

func updateAndPrint() {
	var (
		currFocusTime   int64 // in milliseconds
		goRoutineTime   int64 // in milliseconds
		updateFrequency = time.Second
	)

	// Set your desired values for currFocusTime and goRoutineTime
	currFocusTime = 0
	goRoutineTime =1 * 30 * 1000 // 5 minutes in milliseconds

	startTime := time.Now()
	printStartTime := time.Now()
	fmt.Println("Goroutine started at:", startTime)
	for {
		// Calculate delta time in milliseconds and update currFocusTime
		if time.Since(startTime) > updateFrequency {
		deltaTime := time.Since(startTime).Milliseconds()
		currFocusTime += deltaTime
		startTime = time.Now()
		}

		// Print currFocusTime every minute
		if time.Since(printStartTime) >= time.Minute {
			fmt.Printf("Current Focus Time: %d milliseconds\n", currFocusTime)
			printStartTime = time.Now()
		}

		// Check if goRoutineTime is reached or stopChan is closed
		select {
		case <-stopChan:
			fmt.Println("Goroutine stopped at:", currFocusTime, "of", goRoutineTime, "milliseconds")
			focusRunning = false
			return
		default:
			// Continue updating if stopChan is not closed
		}

		if currFocusTime >= goRoutineTime {
			close(stopChan) // Close the stop channel to signal goroutine to stop
			focusRunning = false
			fmt.Println("Goroutine completed at:", currFocusTime, "of", goRoutineTime, "milliseconds")
			break
		}
	}
}
