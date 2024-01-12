package models
import (
	"karpiem/pkg/data"
)
type NewActivityResponse struct {
	New_Activity data.Activity `json:"new_activity"`
}