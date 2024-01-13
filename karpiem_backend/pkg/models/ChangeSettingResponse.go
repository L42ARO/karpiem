package models

import (
	"karpiem/pkg/data"
)

type ChangeSettingResponse struct {
	Updated_Setting data.Setting `json:"updated_setting"`
}