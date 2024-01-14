package models
import (
	"karpiem/pkg/data"
)
type CreateActivityResponse struct {
	New_Activity data.Activity `json:"new_activity"`
}