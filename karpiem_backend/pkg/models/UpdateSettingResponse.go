package models

import (
	"karpiem/pkg/data"
)

type UpdateSettingResponse struct {
	Updated_Setting data.Setting `json:"updated_setting"`
}