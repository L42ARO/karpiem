package models
type ChangeDoneRequest struct {
	DOrW        bool  	`json:"d_or_w"`
	ID          string	`json:"id"`
	Value       int   	`json:"value"`
	OverrideKey string	`json:"override_key"`
	DayBlocked  bool  	`json:"day_blocked"`
	RoomID	  	string	`json:"room_id"`
}