package models

import (
	"karpiem/pkg/data"
)

type UpdateActivityResponse struct {
	Updated_Activity data.Activity `json:"updated_activity"`
	TriggerStart     bool          `json:"trigger_start"`
	TriggerStop      bool          `json:"trigger_stop"`
	Warn             bool          `json:"warn"`
}
