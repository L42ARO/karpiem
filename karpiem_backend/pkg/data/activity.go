package data

import (
	"time"
)

type Activity struct {
	ID         string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Active     bool      `gorm:"type:boolean;default:true" json:"active"`
	Name       string    `json:"name"`
	Days       string    `json:"days"`
	DPoms      int64     `json:"d_poms"`
	WPoms      int64     `json:"w_poms"`
	DDone      int64     `json:"d_done"`
	WDone      int64     `json:"w_done"`
	LastUpdate time.Time `json:"last_update"`
	Focus      bool      `json:"focus"`
}


