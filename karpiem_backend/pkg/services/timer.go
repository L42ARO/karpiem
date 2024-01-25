package services

import (
	"encoding/json"
	"karpiem/pkg/data"
	"karpiem/pkg/models"
	"karpiem/pkg/shared"
	"log"
	"time"
)

type TimerChannel struct {
	Channel chan bool
	IsOpen  bool
}

const goRoutineTime int64 = 20 * 60 * 1000 // 20 minutes in milliseconds

var TimerChannels map[string]*TimerChannel

// Create a map to store the close channels for each user
func init() {
	TimerChannels = make(map[string]*TimerChannel)
}

func TriggerTimer(user_id string, activity_id string, ws_room_id string) {
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
	go Timer(TimerChannels[user_id], activity_id, ws_room_id)
}

func StopTimer(user_id string) {
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

func Timer(timerChannel *TimerChannel, activity_id string, ws_room string) {
	updateFrequency := time.Second

	startTime := time.Now()
	printStartTime := time.Now()
	db := data.GetDB()
	var activity data.Activity
	db.Where("id = ?", activity_id).First(&activity)
	currFocusTime := activity.FocusTime * 1000 //Convert to milliseconds

	log.Println("Goroutine started at:", startTime)
	SendFocusTime(ws_room, activity, currFocusTime, true, false)
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
			SendFocusTime(ws_room, activity, currFocusTime, true, false)
		}

		// Check if goRoutineTime is reached or stopChan is closed
		select {
		case <-timerChannel.Channel:
			log.Println("Goroutine stopped at:", currFocusTime, "of", goRoutineTime, "milliseconds")
			//Set on the database the focus time
			activity = SetCurrFocusTime(activity_id, currFocusTime, false)
			SendFocusTime(ws_room, activity, currFocusTime, false, true)
			timerChannel.IsOpen = false
			return
		default:
			// Continue updating if stopChan is not closed
		}

		if currFocusTime >= goRoutineTime {
			// close(timerChannel.Channel) // Close the stop channel to signal goroutine to stop
			// timerChannel.IsOpen = false
			currFocusTime = 0
			activity = SetCurrFocusTime(activity_id, currFocusTime, true)
			SendFocusTime(ws_room, activity, currFocusTime, true, false)
			log.Println("Goroutine completed at:", currFocusTime, "of", goRoutineTime, "milliseconds")
			// return
		}
	}
}

func SetCurrFocusTime(activity_id string, currFocusTime int64, increment bool) data.Activity {
	db := data.GetDB()
	var activity data.Activity
	db.Where("id = ?", activity_id).First(&activity)
	activity.FocusTime = currFocusTime / 1000 //Convert to seconds
	if increment {
		//Increment the poms count
		activity.DDone += 1
		activity.WDone += 1
	} else {
		activity.Focus = false
	}
	db.Save(&activity)
	return activity
}

// NOTE: We are passing activity as a paramter as to not have to query the database again
// This assumes though that the activity doesn't change in the database while the timer is running
// Should add a check for that
func SendFocusTime(RoomID string, activity data.Activity, new_focus_time int64, trigger_start bool, trigger_stop bool) {
	if shared.WS_Rooms[RoomID] != nil {
		//Send the message to all the clients in the room
		activity.FocusTime = new_focus_time / 1000 //Convert to seconds
		if trigger_start {
			activity.Focus = true
		} else if trigger_stop {
			activity.Focus = false
		}
		var response models.UpdateActivityResponse
		response.Updated_Activity = activity
		response.TriggerStart = trigger_start
		response.TriggerStop = trigger_stop
		//Stringify the response
		response_string, err := json.Marshal(response)
		if err != nil {
			log.Printf("Error SendFocusTime: %s\n", err.Error())
			return
		}
		for _, conn := range shared.WS_Rooms[RoomID] {
			//Send the message with the prefix SINGLE_UPDATE:
			conn.WriteMessage(1, []byte("SINGLE_UPDATE::"+string(response_string)))
		}
	}
}
