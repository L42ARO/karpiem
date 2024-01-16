package services

import (
	"log"
	"time"
)

type TimerChannel struct{
	Channel chan bool
	IsOpen bool
}

var TimerChannels map[string]*TimerChannel


// Create a map to store the close channels for each user
func init() {
	TimerChannels = make(map[string]*TimerChannel)
}

func TriggerTimer(user_id string, curr_focus_time int64){
	// Check if the user has a channel
	if TimerChannels[user_id] == nil {
		TimerChannels[user_id] = &TimerChannel{Channel: make(chan bool), IsOpen: false}
	}
	// Check if the channel is open
	if TimerChannels[user_id].IsOpen {
		return
	}
	TimerChannels[user_id].Channel = make(chan bool)
	TimerChannels[user_id].IsOpen = true
	go Timer(TimerChannels[user_id], curr_focus_time)
}

func StopTimer(user_id string){
	//Check if the user has a channel
	if TimerChannels[user_id] == nil {
		return
	}
	//Check if the channel is open
	if !TimerChannels[user_id].IsOpen {
		return
	}
	close(TimerChannels[user_id].Channel)
}

func Timer(timerChannel *TimerChannel,currFocusTime int64){
	updateFrequency := time.Second
	var goRoutineTime int64
	goRoutineTime =20 * 60 * 1000 // 20 minutes in milliseconds

	startTime := time.Now()
	printStartTime := time.Now()
	log.Println("Goroutine started at:", startTime)
	for {
		// Calculate delta time in milliseconds and update currFocusTime
		if time.Since(startTime) > updateFrequency {
		deltaTime := time.Since(startTime).Milliseconds()
		currFocusTime += deltaTime
		startTime = time.Now()
		}

		// Print currFocusTime every minute
		if time.Since(printStartTime) >= time.Minute {
			log.Printf("Current Focus Time: %d milliseconds\n", currFocusTime)
			printStartTime = time.Now()
		}

		// Check if goRoutineTime is reached or stopChan is closed
		select {
		case <-timerChannel.Channel:
			log.Println("Goroutine stopped at:", currFocusTime, "of", goRoutineTime, "milliseconds")
			timerChannel.IsOpen = false
			return
		default:
			// Continue updating if stopChan is not closed
		}

		if currFocusTime >= goRoutineTime {
			close(timerChannel.Channel) // Close the stop channel to signal goroutine to stop
			timerChannel.IsOpen = false
			log.Println("Goroutine completed at:", currFocusTime, "of", goRoutineTime, "milliseconds")
			return
		}
	}
}