package models

type ActivityRequest struct {
	Daily bool   `json:"daily"`
	Name  string `json:"name"`
	Poms  int    `json:"poms"`
	Max   int    `json:"max"`
	Days  string `json:"days"`
	RoomID string `json:"room_id"`
}