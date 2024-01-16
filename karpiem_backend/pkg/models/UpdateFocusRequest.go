package models
type FocusRequest struct {
	ID          string `json:"id"`
	Focus       bool   `json:"focus"`
	FocusTime  	int64  `json:"focus_time"`
	RoomID		string `json:"room_id"`
}