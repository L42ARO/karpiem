package controllers

import(
	"net/http"
	"log"
	"encoding/json"
	"karpiem/pkg/models"
	"karpiem/pkg/data"
)

func CreateSettingHandler(w http.ResponseWriter, r *http.Request){
	//Get the setting from the request body
	var request models.CreateSettingRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Println(err)
		return
	}
	//TODO: When we incorporate users, assume user_id wil be in the request and we will check if their setting already exists
	//Create the setting in the database
	db := data.GetDB()
	setting := data.Setting{DaysMax: request.DaysMax}
	db.Create(&setting)
	 //Send the setting back to the client directly
	 w.Header().Set("Content-Type", "application/json")
	 w.WriteHeader(http.StatusOK)
	 json.NewEncoder(w).Encode(setting)
}
func GetSettingHandler(w http.ResponseWriter, r *http.Request){
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

func ChangeSettingHandler(w http.ResponseWriter, r *http.Request){
	// Get the setting from the request body
	var request models.ChangeSettingRequest
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Println(err)
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
	if WS_Rooms[room_id] != nil{
		var response models.ChangeSettingResponse
		response.Updated_Setting = setting
		//Send the response to all clients in the room
		for _, client := range WS_Rooms[room_id] {
			//Stringify the response
			response_string, err := json.Marshal(response)
			if err != nil {
				log.Println(err)
				return
			}
			//Send the response with the prefix "SETTING_UPDATE::"
			client.WriteMessage(1, []byte("SETTING_UPDATE::" + string(response_string)))


		}
	}
	w.WriteHeader(http.StatusOK)
}