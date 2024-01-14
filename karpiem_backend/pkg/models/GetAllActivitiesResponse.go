package models

import (
	"karpiem/pkg/data"
)

type GetAllActivitiesResponse struct {
	Activities []data.Activity `json:"activities"`
}