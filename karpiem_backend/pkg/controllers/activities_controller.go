package controllers

import (
	"log"
	"encoding/json"
	"net/http"
	"time"
	"sort"

	"karpiem/pkg/data"
	"karpiem/pkg/models"
)

func AddActivityHandler(w http.ResponseWriter, r *http.Request) {
	var request models.ActivityRequest

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

	// Send success response to client
	w.WriteHeader(http.StatusOK)
	//Send the result to the client in JSON format
	json.NewEncoder(w).Encode(activity)

}


func GetDayActivitiesHandler(w http.ResponseWriter, r *http.Request) {
	// Get current day
	currentDay := time.Now().Weekday().String()
	// Make sure we go by M T W R F S U
	if currentDay == "Monday" {
		currentDay = "M"
	} else if currentDay == "Tuesday" {
		currentDay = "T"
	} else if currentDay == "Wednesday" {
		currentDay = "W"
	} else if currentDay == "Thursday" {
		currentDay = "R"
	} else if currentDay == "Friday" {
		currentDay = "F"
	} else if currentDay == "Saturday" {
		currentDay = "S"
	} else if currentDay == "Sunday" {
		currentDay = "U"
	}
	log.Println("Current day: ", currentDay)

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
	// Sort the response list by the Done field (false first)
	sort.Slice(activities, func(i, j int) bool {
		full_i := activities[i].DDone >= activities[i].DPoms
		full_j := activities[j].DDone >= activities[j].DPoms
		return !full_i && full_j
	})
	
	//Go thorugh res_list and split it into two lists, one with the dailies and one with the options
	//NOTE: By sorting before splitting we ensure to only sort once
	var dailies []models.DayActivityResponse
	var options []models.DayActivityResponse
	for _, activity := range activities {
		shortened_activity:= models.DayActivityResponse{
			ID:    activity.ID,
			Name:  activity.Name,
			DPoms: activity.DPoms,
			DDone: activity.DDone,
			Full:  activity.DDone >= activity.DPoms,
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
	
	//Sort the response list by the Done field (false first)
	sort.Slice(activities, func(i, j int) bool {
		full_i := activities[i].WDone >= activities[i].WPoms
		full_j := activities[j].WDone >= activities[j].WPoms
		return !full_i && full_j
	})

	//NOTE: By sorting before splitting we ensure that we only sort once
	var dailies []models.WeekActivityResponse
	var weeklies []models.WeekActivityResponse
	for _, activity := range activities {
		shortened_activity:= models.WeekActivityResponse{
			ID: activity.ID,
			Name: activity.Name,
			WPoms: activity.WPoms,
			WDone: activity.WDone,
			Full: activity.WDone >= activity.WPoms,
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
		}
	}
	// Check if the new value is greater than the Poms value
	if newWDone > activity.WPoms || newDDone > activity.DPoms {
		// Check override key
		if request.OverrideKey != "1234" {
			http.Error(w, "Invalid override key", http.StatusUnauthorized)
			return
		}
	}

	// Update the Done field with the new value
	activity.WDone = newWDone
	activity.DDone = newDDone

	// Save the changes to the database
	result = db.Save(&activity)

	// Check for errors
	if result.Error != nil {
		http.Error(w, "Failed to update activity", http.StatusInternalServerError)
		return
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
	db.Where("id = ?", deleteId).Delete(&data.Activity{})

	// Check the id no longer exists
	var activity data.Activity
	result := db.Where("id = ?", deleteId).First(&activity)
	if result.Error == nil {
		http.Error(w, "Failed delete check", http.StatusInternalServerError)
		return
	}
	if result.RowsAffected != 0 {
		http.Error(w, "Failed to delete activity", http.StatusInternalServerError)
		return
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(activity)

}