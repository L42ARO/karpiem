package models
type FocusRequest struct {
	ID          string `json:"id"`
	Focus       bool   `json:"focus"`
	RoomID		string `json:"room_id"`
}