package controllers

import (
	"log"
	"encoding/json"
	"net/http"
	"time"
	"strings"

	"karpiem/pkg/data"
	"karpiem/pkg/models"
)

func CreateActivityHandler(w http.ResponseWriter, r *http.Request) {
	var request models.CreateActivityRequest

	// Decode JSON request body
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Close the request body
	defer r.Body.Close()

	// Determine Poms based on Daily flag
	if request.Daily {
		request.Poms = 7 * request.Max
	}

	// Create Activity object
	activity := data.Activity{
		Name:       request.Name,
		Days:       request.Days,
		WPoms:      int64(request.Poms),
		DPoms:      int64(request.Max),
		LastUpdate: time.Now(),
	}

	// Get the GORM database connection
	db := data.GetDB()

	// Create a new record in the database
	result := db.Create(&activity)

	// Check for errors
	if result.Error != nil {
		http.Error(w, "Failed to add activity to database", http.StatusInternalServerError)
		return
	}

	// Broadcast the change to all the clients in the room
	//Check if the room exists
	if WS_Rooms[request.RoomID] != nil {
		//Send the message to all the clients in the room
		var response models.CreateActivityResponse
		response.New_Activity = activity
		//Stringify the response
		response_string, err := json.Marshal(response)
		if err != nil{
			http.Error(w, "Error broadcasting change", http.StatusInternalServerError)
		}
		for _, conn := range WS_Rooms[request.RoomID]{
			//Send the message with the prefix SINGLE_UPDATE:
			conn.WriteMessage(1, []byte("SINGLE_NEW::" + string(response_string)))
		}
	}

	// Send success response to client
	w.WriteHeader(http.StatusOK)
	//Send the result to the client in JSON format
	json.NewEncoder(w).Encode(activity)

}

func GetAllActivitiesHandler(w http.ResponseWriter, r *http.Request) {
	// Get the GORM database connection
	db := data.GetDB()

	// Find all activities
	var activities []data.Activity
	result := db.Find(&activities)

	// Check for errors
	if result.Error != nil {
		http.Error(w, "Failed to get activities", http.StatusInternalServerError)
		return
	}
	res := models.GetAllActivitiesResponse{
		Activities: activities,
	}
	// Send the activities back to the client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(res)

}


func GetDayActivitiesHandler(w http.ResponseWriter, r *http.Request) {
	//Get current day from url query
	currentDay := r.URL.Query().Get("current_day")
	log.Println("Current day: ", currentDay)
	//Check that the current day is either: "M", "T", "W", "R", "F", "S", "U"
	dayOptions := "MTWRFSU"
	if !strings.Contains(dayOptions, currentDay) {
		http.Error(w, "Invalid day", http.StatusBadRequest)
		return
	}
	// Begin query for activities
	db := data.GetDB()

	var activities []data.Activity

	//Start query looking for activiteis with the current day on the Days field as a substring
	query := db.Where("days LIKE ?", "%"+currentDay+"%")

	//Filter by activities that are active
	query = query.Where("active = ?", true)

	// Execute the query and get a list
	if err := query.Find(&activities).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// Log how many activities were found
	log.Println("Found ", len(activities), " activities")
	// Create a response with the required properties
	var totalPoms int64
	var totalDone int64

	//Go thorugh res_list and split it into two lists, one with the dailies and one with the options
	var dailies []models.DayActivityResponse
	var options []models.DayActivityResponse
	for _, activity := range activities {
		shortened_activity:= models.DayActivityResponse{
			ID:    activity.ID,
			Name:  activity.Name,
			DPoms: activity.DPoms,
			DDone: activity.DDone,
			Full:  activity.DDone >= activity.DPoms || activity.WDone >= activity.WPoms,
			Focus: activity.Focus,
		}
		//Dailies are the ones whose WPoms = 7 * DPoms
		if activity.WPoms == 7 * activity.DPoms {
			dailies = append(dailies, shortened_activity)
		}else{
			options = append(options, shortened_activity)
		}
		totalPoms += activity.DPoms
		totalDone += activity.DDone
	}


	var response models.DayAcitivitiesResponse
	response.Dailies = dailies
	response.Options = options
	response.TotalPoms = totalPoms
	response.TotalDone = totalDone
	// Return the response as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetWeekActivitiesHandler(w http.ResponseWriter, r *http.Request){
	db := data.GetDB()
	var activities []data.Activity
	//Get all activities that are active
	query := db.Where("active = ?", true)
	if err := query.Find(&activities).Error; err != nil{
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	var totalPoms int64
	var totalDone int64
	
	var dailies []models.WeekActivityResponse
	var weeklies []models.WeekActivityResponse
	for _, activity := range activities {
		shortened_activity:= models.WeekActivityResponse{
			ID: activity.ID,
			Name: activity.Name,
			WPoms: activity.WPoms,
			WDone: activity.WDone,
			Full: activity.WDone >= activity.WPoms,
			Focus: activity.Focus,
		}
		//Get the number of days the activity is active, should be the number of characters in the Days field
		days_active := len(activity.Days)
		//Dailies are the ones whose WPoms = days_active * DPoms

		if activity.WPoms == int64(days_active) * activity.DPoms {
			dailies = append(dailies, shortened_activity)
		}else{
			weeklies = append(weeklies, shortened_activity)
		}
		totalPoms += activity.WPoms
		totalDone += activity.WDone
	}

	var response models.WeekAcitivitiesResponse
	response.Dailies = dailies
	response.Weeklies = weeklies
	response.TotalPoms = totalPoms
	response.TotalDone = totalDone
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}



func ChangeDoneHandler(w http.ResponseWriter, r *http.Request) {
	var request models.ChangeDoneRequest

	// Decode JSON request body
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Close the request body
	defer r.Body.Close()

	//Value must be greater than 0
	if request.Value < 0 {
		http.Error(w, "Value must be greater than 0", http.StatusBadRequest)
		return
	}

	// Get the GORM database connection
	db := data.GetDB()

	// Find the activity by ID
	var activity data.Activity
	result := db.Where("id = ?", request.ID).First(&activity)

	// Check if the activity exists
	if result.Error != nil {
		http.Error(w, "Activity not found", http.StatusNotFound)
		return
	}

	
	var newWDone int64
	var newDDone int64

	if request.DOrW {
		newDDone = int64(request.Value)
		delta := newDDone - activity.DDone
		newWDone = activity.WDone + delta
	}else{
		newWDone = int64(request.Value)
		if int64(request.Value) < activity.DDone {
			newDDone = int64(request.Value) //Eg: if we request the week poms to lower from 3 to 1 and the day poms is 2, we need to lower the day poms to 1
		}else{
			newDDone = activity.DDone
		}
	}
	check1 := newWDone > activity.WPoms
	check2 := newDDone > activity.DPoms
	check3 := request.DayBlocked
	//Finally we should only be asking for override key if the user is trying to increase the value
	check4 := (request.DOrW && newDDone > activity.DDone) || (!request.DOrW && newWDone > activity.WDone)
	if (check1 || check2 || check3) && check4 {
		log.Println("newWDone: ", newWDone, "activity.WPoms", activity.WPoms, " newDDone: ", newDDone, "activity.DPoms", activity.DPoms)
		// Check override key
		if request.OverrideKey != "1234" {
			//Print out all the values for debugging
			http.Error(w, "Invalid override key", http.StatusUnauthorized)
			return
		}
	}

	// Update the Done field with the new value
	log.Println("Updating with-> newWDone: ", newWDone, " newDDone: ", newDDone)
	activity.WDone = newWDone
	activity.DDone = newDDone

	// Save the changes to the database
	result = db.Save(&activity)

	// Check for errors
	if result.Error != nil {
		http.Error(w, "Failed to update activity", http.StatusInternalServerError)
		return
	}
	//Broadcast the change to all the clients in the room
	//Check if the room exists
	if WS_Rooms[request.RoomID] != nil {
		//Send the message to all the clients in the room
		var response models.UpdateActivityResponse
		response.Updated_Activity = activity
		//Stringify the response
		response_string, err := json.Marshal(response)
		if err != nil{
			log.Println("Error stringifying response")
			http.Error(w, "Error broadcasting change", http.StatusInternalServerError)
		}
		for _, conn := range WS_Rooms[request.RoomID]{
			//Send the message with the prefix SINGLE_UPDATE:
			conn.WriteMessage(1, []byte("SINGLE_UPDATE::" + string(response_string)))

		}
	}
	// Send the updated activity object back to the client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(activity)
}

func ResetWeekHandler(w http.ResponseWriter, r *http.Request) {
	// Get the GORM database connection
	db := data.GetDB()

	// Find all activities
	var activities []data.Activity
	result := db.Find(&activities)

	// Check for errors
	if result.Error != nil {
		http.Error(w, "Failed to get activities", http.StatusInternalServerError)
		return
	}

	// Reset all activities
	for _, activity := range activities {
		activity.WDone = 0
		db.Save(&activity)
	}

	//Broadcast the change to all the clients in the room
	//Check if the room exists
	room_id := r.URL.Query().Get("room_id")
	//Broadcast the change to all the clients in the room
	//Check if the room exists
	if WS_Rooms[room_id] != nil {
		for _, conn := range WS_Rooms[room_id]{
			//Send it as command BATCH_RESET
			conn.WriteMessage(1, []byte("BATCH_RESET::WEEK"))
		}
	}


	// Send success response to client
	w.WriteHeader(http.StatusOK)
}

func ResetDayHandler(w http.ResponseWriter, r *http.Request) {
	// Get the GORM database connection
	db := data.GetDB()

	// Find all activities
	var activities []data.Activity
	result := db.Find(&activities)

	// Check for errors
	if result.Error != nil {
		http.Error(w, "Failed to get activities", http.StatusInternalServerError)
		return
	}

	// Reset all activities
	for _, activity := range activities {
		activity.DDone = 0
		db.Save(&activity)
	}

	//Get room id from url
	room_id := r.URL.Query().Get("room_id")
	//Broadcast the change to all the clients in the room
	//Check if the room exists
	if WS_Rooms[room_id] != nil {
		for _, conn := range WS_Rooms[room_id]{
			//Send it as command BATCH_RESET
			conn.WriteMessage(1, []byte("BATCH_RESET::DAY"))
		}
	}
	// Send success response to client
	w.WriteHeader(http.StatusOK)
}

func DeleteActivityHandler(w http.ResponseWriter, r *http.Request){
	var request models.DeleteActivityRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil{
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	deleteId := request.ID

	db := data.GetDB()
	delete_res:= db.Where("id = ?", deleteId).Delete(&data.Activity{})
	if delete_res.Error != nil {
		http.Error(w, "Failed to delete activity", http.StatusInternalServerError)
		return
	}

	// Check the id no longer exists
	var activity data.Activity
	result := db.Where("id = ?", deleteId).First(&activity)
	if result.Error != nil && result.Error.Error() != "record not found" {
		http.Error(w, "Error during delete check", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected != 0 {
		http.Error(w, "Failed to delete activity", http.StatusInternalServerError)
		return
	}
	//Broadcast the change to all the clients in the room
	//Check if the room exists
	if WS_Rooms[request.RoomID] != nil {
		//Send the message to all the clients in the room
		var response models.DeleteActivityResponse
		response.Deleted_ID = deleteId
		//Stringify the response
		response_string, err := json.Marshal(response)
		if err != nil{
			http.Error(w, "Error broadcasting change", http.StatusInternalServerError)
		}
		for _, conn := range WS_Rooms[request.RoomID]{
			//Send the message with the prefix SINGLE_UPDATE:
			conn.WriteMessage(1, []byte("SINGLE_DELETE::" + string(response_string)))
		}
	}

	w.WriteHeader(http.StatusOK)
}

func UpdateActivityHandler(w http.ResponseWriter, r *http.Request){
	var request models.UpdateActivityRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil{
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if request.Daily{
		request.Poms = 7 * request.Max
	}

	db := data.GetDB()
	var activity data.Activity
	 
	// Find the activity by ID
	result := db.Where("id = ?", request.ID).First(&activity)
	if result.Error != nil {
		http.Error(w, "Activity not found", http.StatusNotFound)
		return
	}

	activity.Name = request.Name
	activity.Active = request.Active
	activity.Days = request.Days
	activity.WPoms = int64(request.Poms)
	activity.DPoms = int64(request.Max)

	result = db.Save(&activity)
	if result.Error != nil {
		http.Error(w, "Failed to update activity", http.StatusInternalServerError)
		return
	}

	//Broadcast the change to all the clients in the room
	//Check if the room exists
	if WS_Rooms[request.RoomID] != nil {
		//Send the message to all the clients in the room
		var response models.UpdateActivityResponse
		response.Updated_Activity = activity
		//Stringify the response
		response_string, err := json.Marshal(response)
		if err != nil{
			http.Error(w, "Error broadcasting change", http.StatusInternalServerError)
		}
		for _, conn := range WS_Rooms[request.RoomID]{
			//Send the message with the prefix SINGLE_UPDATE:
			conn.WriteMessage(1, []byte("SINGLE_UPDATE::" + string(response_string)))
		}
	}


	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(activity)

}

func FocusRequestHandler(w http.ResponseWriter, r *http.Request){
	var request models.FocusRequest
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil{
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	db := data.GetDB()
	var activity data.Activity
	result := db.Where("id = ?", request.ID).First(&activity)
	if result.Error != nil {
		http.Error(w, "Activity not found", http.StatusNotFound)
		return
	}
	if request.Focus{
		var other_focus data.Activity
		result := db.Where("focus = ?", true).First(&other_focus)
		if result.Error != nil && result.Error.Error() != "record not found" {
			http.Error(w, "Error checking for focus", http.StatusNotFound)
			return
		}
		if result.RowsAffected != 0{
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusConflict)
			json.NewEncoder(w).Encode(other_focus)
			return
		}

	}

	activity.Focus = request.Focus
	result = db.Save(&activity)
	if result.Error != nil {
		http.Error(w, "Failed to update activity", http.StatusInternalServerError)
		return
	}
	//Broadcast the change to all the clients in the room
	//Check if the room exists
	if WS_Rooms[request.RoomID] != nil {
		//Send the message to all the clients in the room
		var response models.UpdateActivityResponse
		response.Updated_Activity = activity
		//Stringify the response
		response_string, err := json.Marshal(response)
		if err != nil{
			http.Error(w, "Error broadcasting change", http.StatusInternalServerError)
		}
		for _, conn := range WS_Rooms[request.RoomID]{
			//Send the message with the prefix SINGLE_UPDATE:
			conn.WriteMessage(1, []byte("SINGLE_UPDATE::" + string(response_string)))
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(activity)
}