package models

type DeleteActivityRequest struct {
	ID string `json:"id"`
	RoomID string `json:"room_id"`
}