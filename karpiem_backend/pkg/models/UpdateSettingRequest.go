package models

type UpdateSettingRequest struct {
	DaysMax string `json:"days_max"`
	RoomID string `json:"room_id"`
}