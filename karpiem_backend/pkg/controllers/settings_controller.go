package controllers

import (
	"encoding/json"
	"karpiem/pkg/data"
	"karpiem/pkg/models"
	"karpiem/pkg/shared"
	"log"
	"net/http"
)

func CreateSettingHandler(w http.ResponseWriter, r *http.Request) {
	//User_id will be in the url query
	user_id := r.URL.Query().Get("user_id")
	//If there is no user_id, return an error
	if user_id == "" {
		log.Println("No user_id in url query")
		http.Error(w, "No user_id in url query", http.StatusBadRequest)
		return
	}
	//Create the setting in the database
	db := data.GetDB()
	setting := data.Setting{
		UserID:  user_id,
		DaysMax: "0C0C0C0C0C0C0C",
		WeekMax: 86,
	}
	db.Create(&setting)
	//Send the setting back to the client directly
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(setting)
}
func GetSettingHandler(w http.ResponseWriter, r *http.Request) {
	//TODO: When we incorporate users, assume user_id will be in the url query
	//Get the setting from the database
	db := data.GetDB()
	var setting data.Setting
	db.First(&setting)
	//Send the setting back to the client directly
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(setting)
}

func UpdateSettingHandler(w http.ResponseWriter, r *http.Request) {
	// Get the setting from the request body
	var request models.UpdateSettingRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		msg := "Error decoding request body"
		log.Println(msg)
		http.Error(w, msg, http.StatusBadRequest)
		return
	}
	// Get the setting from the database
	db := data.GetDB()
	//Just get the first setting for updating
	var setting data.Setting
	db.First(&setting)
	// Update the setting
	setting.DaysMax = request.DaysMax
	// Save the setting
	db.Save(&setting)
	// Broadcast the updated setting to all clients
	room_id := request.RoomID
	//Check if the room exists
	if shared.WS_Rooms[room_id] != nil {
		var response models.UpdateSettingResponse
		response.Updated_Setting = setting
		//Send the response to all clients in the room
		response_string, err := json.Marshal(response)
		if err != nil {
			msg := "Error marshalling response"
			log.Println(msg)
			http.Error(w, msg, http.StatusMultiStatus)
			return
		}
		for _, client := range shared.WS_Rooms[room_id] {
			//Stringify the response
			//Send the response with the prefix "SETTING_UPDATE::"
			client.WriteMessage(1, []byte("SETTING_UPDATE::"+string(response_string)))

		}
	}
	w.WriteHeader(http.StatusOK)
}
