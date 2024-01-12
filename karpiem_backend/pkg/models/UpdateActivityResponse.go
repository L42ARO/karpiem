package models
import (
	"karpiem/pkg/data"
)
type UpdateActivityResponse struct {
	Updated_Activity data.Activity	`json:"updated_activity"`
}