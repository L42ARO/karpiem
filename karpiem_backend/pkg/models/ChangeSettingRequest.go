package models

type ChangeSettingRequest struct {
	DaysMax string `json:"days_max"`
	RoomID string `json:"room_id"`
}